'use strict';

const EventEmitter = require('events').EventEmitter;
const shuffle = require('lodash/shuffle');
const cloneDeep = require('lodash/cloneDeep');
const Promise = require('bluebird');
const util = require('./util');
const Document = require('./document');
const Query = require('./query');
const Schema = require('./schema');
const Types = require('./types');
const WarehouseError = require('./error');
const PopulationError = require('./error/population');
const Mutex = require('./mutex');

const parseArgs = util.parseArgs;
const reverse = util.reverse;
const getProp = util.getProp;
const setGetter = util.setGetter;
const isArray = Array.isArray;

/**
 * Model constructor.
 *
 * @class
 * @param {string} name Model name
 * @param {Schema|object} [schema] Schema
 * @extends EventEmitter
 */
function Model(name, schema_) {
  EventEmitter.call(this);

  let schema;

  // Define schema
  if (schema_ instanceof Schema) {
    schema = schema_;
  } else if (typeof schema_ === 'object') {
    schema = new Schema(schema_);
  } else {
    schema = new Schema();
  }

  // Set `_id` path for schema
  if (!schema.path('_id')) {
    schema.path('_id', {type: Types.CUID, required: true});
  }

  this.name = name;
  this.data = {};
  this._mutex = new Mutex();
  this.schema = schema;
  this.length = 0;

  const _Document = this.Document = function(data) {
    Document.call(this, data);

    // Apply getters
    schema._applyGetters(this);
  };

  util.inherits(_Document, Document);
  _Document.prototype._model = this;
  _Document.prototype._schema = schema;

  const _Query = this.Query = function(data) {
    Query.call(this, data);
  };

  util.inherits(_Query, Query);
  _Query.prototype._model = this;
  _Query.prototype._schema = schema;

  // Apply static methods
  const statics = schema.statics;
  const staticKeys = Object.keys(statics);

  for (let i = 0, len = staticKeys.length; i < len; i++) {
    const key = staticKeys[i];
    this[key] = statics[key];
  }

  // Apply instance methods
  const methods = schema.methods;
  const methodKeys = Object.keys(methods);

  for (let i = 0, len = methodKeys.length; i < len; i++) {
    const key = methodKeys[i];
    _Document.prototype[key] = methods[key];
  }
}

util.inherits(Model, EventEmitter);

/**
 * Creates a new document.
 *
 * @param {object} data
 * @return {Document}
 */
Model.prototype.new = function(data) {
  return new this.Document(data);
};

/**
 * Finds a document by its identifier.
 *
 * @param {*} id
 * @param {object} options
 *   @param {boolean} [options.lean=false] Returns a plain JavaScript object
 * @return {Document|object}
 */
Model.prototype.findById = function(id, options_) {
  const raw = this.data[id];
  if (!raw) return;

  const options = Object.assign({
    lean: false
  }, options_);

  const data = cloneDeep(raw);
  return options.lean ? data : this.new(data);
};

Model.prototype.get = Model.prototype.findById;

/**
 * Checks if the model contains a document with the specified id.
 *
 * @param {*} id
 * @return {boolean}
 */
Model.prototype.has = function(id) {
  return Boolean(this.data[id]);
};

function execHooks(schema, type, event, data) {
  const hooks = schema.hooks[type][event];
  if (!hooks.length) return Promise.resolve(data);

  return Promise.each(hooks, hook => hook(data)).thenReturn(data);
}

/**
 * Acquires write lock.
 *
 * @param {*} id
 * @return {Promise}
 * @private
 */
Model.prototype._acquireWriteLock = function(id) {
  const mutex = this._mutex;

  return new Promise((resolve, reject) => {
    mutex.lock(resolve);
  }).disposer(() => {
    mutex.unlock();
  });
};

/**
 * Inserts a document.
 *
 * @param {Document|object} data
 * @return {Promise}
 * @private
 */
Model.prototype._insertOne = function(data_) {
  const schema = this.schema;

  // Apply getters
  const data = data_ instanceof this.Document ? data_ : this.new(data_);
  const id = data._id;

  // Check ID
  if (!id) {
    return Promise.reject(new WarehouseError('ID is not defined', WarehouseError.ID_UNDEFINED));
  }

  if (this.has(id)) {
    return Promise.reject(new WarehouseError('ID `' + id + '` has been used', WarehouseError.ID_EXIST));
  }

  // Apply setters
  const result = data.toObject();
  schema._applySetters(result);

  // Pre-hooks
  return execHooks(schema, 'pre', 'save', data).then(data => {
    // Insert data
    this.data[id] = result;
    this.length++;

    this.emit('insert', data);
    return execHooks(schema, 'post', 'save', data);
  });
};

/**
 * Inserts a document.
 *
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.insertOne = function(data, callback) {
  return Promise.using(this._acquireWriteLock(), () => this._insertOne(data)).asCallback(callback);
};

/**
 * Inserts documents.
 *
 * @param {object|array} data
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.insert = function(data, callback) {
  if (isArray(data)) {
    return Promise.mapSeries(data, item => this.insertOne(item)).asCallback(callback);
  }

  return this.insertOne(data, callback);
};

/**
 * Inserts the document if it does not exist; otherwise updates it.
 *
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.save = function(data, callback) {
  const id = data._id;

  if (!id) return this.insertOne(data, callback);

  return Promise.using(this._acquireWriteLock(), () => {
    if (this.has(id)) {
      return this._replaceById(id, data);
    }

    return this._insertOne(data);
  }).asCallback(callback);
};

/**
 * Updates a document with a compiled stack.
 *
 * @param {*} id
 * @param {array} stack
 * @return {Promise}
 * @private
 */
Model.prototype._updateWithStack = function(id, stack) {
  const schema = this.schema;

  const data = this.data[id];

  if (!data) {
    return Promise.reject(new WarehouseError('ID `' + id + '` does not exist', WarehouseError.ID_NOT_EXIST));
  }

  // Clone data
  let result = cloneDeep(data);

  // Update
  for (let i = 0, len = stack.length; i < len; i++) {
    stack[i](result);
  }

  // Apply getters
  const doc = this.new(result);

  // Apply setters
  result = doc.toObject();
  schema._applySetters(result);

  // Pre-hooks
  return execHooks(schema, 'pre', 'save', doc).then(data => {
    // Update data
    this.data[id] = result;

    this.emit('update', data);
    return execHooks(schema, 'post', 'save', data);
  });
};

/**
 * Finds a document by its identifier and update it.
 *
 * @param {*} id
 * @param {object} update
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.updateById = function(id, update, callback) {
  return Promise.using(this._acquireWriteLock(), () => {
    const stack = this.schema._parseUpdate(update);
    return this._updateWithStack(id, stack);
  }).asCallback(callback);
};

/**
 * Updates matching documents.
 *
 * @param {object} query
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.update = function(query, data, callback) {
  return this.find(query).update(data, callback);
};

/**
 * Finds a document by its identifier and replace it.
 *
 * @param {*} id
 * @param  {object} data
 * @return {Promise}
 * @private
 */
Model.prototype._replaceById = function(id, data_) {
  const schema = this.schema;

  if (!this.has(id)) {
    return Promise.reject(new WarehouseError('ID `' + id + '` does not exist', WarehouseError.ID_NOT_EXIST));
  }

  data_._id = id;

  // Apply getters
  const data = data_ instanceof this.Document ? data_ : this.new(data_);

  // Apply setters
  const result = data.toObject();
  schema._applySetters(result);

  // Pre-hooks
  return execHooks(schema, 'pre', 'save', data).then(data => {
    // Replace data
    this.data[id] = result;

    this.emit('update', data);
    return execHooks(schema, 'post', 'save', data);
  });
};

/**
 * Finds a document by its identifier and replace it.
 *
 * @param {*} id
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.replaceById = function(id, data, callback) {
  return Promise.using(this._acquireWriteLock(), () => this._replaceById(id, data)).asCallback(callback);
};

/**
 * Replaces matching documents.
 *
 * @param {object} query
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.replace = function(query, data, callback) {
  return this.find(query).replace(data, callback);
};

/**
 * Finds a document by its identifier and remove it.
 *
 * @param {*} id
 * @param {function} [callback]
 * @return {Promise}
 * @private
 */
Model.prototype._removeById = function(id) {
  const schema = this.schema;

  const data = this.data[id];

  if (!data) {
    return Promise.reject(new WarehouseError('ID `' + id + '` does not exist', WarehouseError.ID_NOT_EXIST));
  }

  // Pre-hooks
  return execHooks(schema, 'pre', 'remove', data).then(data => {
    // Remove data
    this.data[id] = null;
    this.length--;

    this.emit('remove', data);
    return execHooks(schema, 'post', 'remove', data);
  });
};

/**
 * Finds a document by its identifier and remove it.
 *
 * @param {*} id
 * @param {function} [callback]
 * @return {Promise}
 */
Model.prototype.removeById = function(id, callback) {
  return Promise.using(this._acquireWriteLock(), () => this._removeById(id)).asCallback(callback);
};

/**
 * Removes matching documents.
 *
 * @param {object} query
 * @param {object} [callback]
 * @return {Promise}
 */
Model.prototype.remove = function(query, callback) {
  return this.find(query).remove(callback);
};

/**
 * Deletes a model.
 */
Model.prototype.destroy = function() {
  this._database._models[this.name] = null;
};

/**
 * Returns the number of elements.
 *
 * @return {number}
 */
Model.prototype.count = function() {
  return this.length;
};

Model.prototype.size = Model.prototype.count;

/**
 * Iterates over all documents.
 *
 * @param {function} iterator
 * @param {object} [options] See {@link Model#findById}.
 */
Model.prototype.forEach = function(iterator, options) {
  const keys = Object.keys(this.data);
  let num = 0;

  for (let i = 0, len = keys.length; i < len; i++) {
    const data = this.findById(keys[i], options);
    if (data) iterator(data, num++);
  }
};

Model.prototype.each = Model.prototype.forEach;

/**
 * Returns an array containing all documents.
 *
 * @param {Object} [options] See {@link Model#findById}.
 * @return {Array}
 */
Model.prototype.toArray = function(options) {
  const result = new Array(this.length);

  this.forEach((item, i) => {
    result[i] = item;
  }, options);

  return result;
};

/**
 * Finds matching documents.
 *
 * @param {Object} query
 * @param {Object} [options]
 *   @param {Number} [options.limit=0] Limits the number of documents returned.
 *   @param {Number} [options.skip=0] Skips the first elements.
 *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
 * @return {Query|Array}
 */
Model.prototype.find = function(query, options_) {
  const options = options_ || {};
  const filter = this.schema._execQuery(query);
  const keys = Object.keys(this.data);
  const len = keys.length;
  let limit = options.limit || this.length;
  let skip = options.skip;
  const data = this.data;
  const arr = [];

  for (let i = 0; limit && i < len; i++) {
    const key = keys[i];
    const item = data[key];

    if (item && filter(item)) {
      if (skip) {
        skip--;
      } else {
        arr.push(this.findById(key, options));
        limit--;
      }
    }
  }

  return options.lean ? arr : new this.Query(arr);
};

/**
 * Finds the first matching documents.
 *
 * @param {Object} query
 * @param {Object} [options]
 *   @param {Number} [options.skip=0] Skips the first elements.
 *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
 * @return {Document|Object}
 */
Model.prototype.findOne = function(query, options_) {
  const options = options_ || {};
  options.limit = 1;

  const result = this.find(query, options);
  return options.lean ? result[0] : result.data[0];
};

/**
 * Sorts documents. See {@link Query#sort}.
 *
 * @param {String|Object} orderby
 * @param {String|Number} [order]
 * @return {Query}
 */
Model.prototype.sort = function(orderby, order) {
  const sort = parseArgs(orderby, order);
  const fn = this.schema._execSort(sort);

  return new this.Query(this.toArray().sort(fn));
};

/**
 * Returns the document at the specified index. `num` can be a positive or
 * negative number.
 *
 * @param {Number} i
 * @param {Object} [options] See {@link Model#findById}.
 * @return {Document|Object}
 */
Model.prototype.eq = function(i_, options) {
  let index = i_ < 0 ? this.length + i_ : i_;
  const data = this.data;
  const keys = Object.keys(data);

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    const item = data[key];

    if (!item) continue;

    if (index) {
      index--;
    } else {
      return this.findById(key, options);
    }
  }
};

/**
 * Returns the first document.
 *
 * @param {Object} [options] See {@link Model#findById}.
 * @return {Document|Object}
 */
Model.prototype.first = function(options) {
  return this.eq(0, options);
};

/**
 * Returns the last document.
 *
 * @param {Object} [options] See {@link Model#findById}.
 * @return {Document|Object}
 */
Model.prototype.last = function(options) {
  return this.eq(-1, options);
};

/**
 * Returns the specified range of documents.
 *
 * @param {Number} start
 * @param {Number} [end]
 * @return {Query}
 */
Model.prototype.slice = function(start_, end_) {
  const total = this.length;

  let start = start_ | 0;
  if (start < 0) start += total;
  if (start > total - 1) return new this.Query([]);

  let end = end_ | 0 || total;
  if (end < 0) end += total;

  let len = start > end ? 0 : end - start;
  if (len > total) len = total - start;
  if (!len) return new this.Query([]);

  const arr = new Array(len);
  const keys = Object.keys(this.data);
  const keysLen = keys.length;
  let num = 0;

  for (let i = 0; num < len && i < keysLen; i++) {
    const data = this.findById(keys[i]);
    if (!data) continue;

    if (start) {
      start--;
    } else {
      arr[num++] = data;
    }
  }

  return new this.Query(arr);
};

/**
 * Limits the number of documents returned.
 *
 * @param {Number} i
 * @return {Query}
 */
Model.prototype.limit = function(i) {
  return this.slice(0, i);
};

/**
 * Specifies the number of items to skip.
 *
 * @param {Number} i
 * @return {Query}
 */
Model.prototype.skip = function(i) {
  return this.slice(i);
};

/**
 * Returns documents in a reversed order.
 *
 * @return {Query}
 */
Model.prototype.reverse = function() {
  return new this.Query(reverse(this.toArray()));
};

/**
 * Returns documents in random order.
 *
 * @return {Query}
 */
Model.prototype.shuffle = function() {
  return new this.Query(shuffle(this.toArray()));
};

Model.prototype.random = Model.prototype.shuffle;

/**
 * Creates an array of values by iterating each element in the collection.
 *
 * @param {Function} iterator
 * @param {Object} [options]
 * @return {Array}
 */
Model.prototype.map = function(iterator, options) {
  const result = new Array(this.length);

  this.forEach((item, i) => {
    result[i] = iterator(item, i);
  }, options);

  return result;
};

/**
 * Reduces a collection to a value which is the accumulated result of iterating
 * each element in the collection.
 *
 * @param {Function} iterator
 * @param {*} [initial] By default, the initial value is the first document.
 * @return {*}
 */
Model.prototype.reduce = function(iterator, initial) {
  const arr = this.toArray();
  const len = this.length;
  let i, result;

  if (initial === undefined) {
    i = 1;
    result = arr[0];
  } else {
    i = 0;
    result = initial;
  }

  for (; i < len; i++) {
    result = iterator(result, arr[i], i);
  }

  return result;
};

/**
 * Reduces a collection to a value which is the accumulated result of iterating
 * each element in the collection from right to left.
 *
 * @param {Function} iterator
 * @param {*} [initial] By default, the initial value is the last document.
 * @return {*}
 */
Model.prototype.reduceRight = function(iterator, initial) {
  const arr = this.toArray();
  const len = this.length;
  let i, result;

  if (initial === undefined) {
    i = len - 2;
    result = arr[len - 1];
  } else {
    i = len - 1;
    result = initial;
  }

  for (; i >= 0; i--) {
    result = iterator(result, arr[i], i);
  }

  return result;
};

/**
 * Creates a new array with all documents that pass the test implemented by the
 * provided function.
 *
 * @param {Function} iterator
 * @param {Object} [options]
 * @return {Query}
 */
Model.prototype.filter = function(iterator, options) {
  const arr = [];

  this.forEach((item, i) => {
    if (iterator(item, i)) arr.push(item);
  }, options);

  return new this.Query(arr);
};

/**
 * Tests whether all documents pass the test implemented by the provided
 * function.
 *
 * @param {Function} iterator
 * @return {Boolean}
 */
Model.prototype.every = function(iterator) {
  const keys = Object.keys(this.data);
  const len = keys.length;
  let num = 0;

  if (!len) return true;

  for (let i = 0; i < len; i++) {
    const data = this.findById(keys[i]);

    if (data) {
      if (!iterator(data, num++)) return false;
    }
  }

  return true;
};

/**
 * Tests whether some documents pass the test implemented by the provided
 * function.
 *
 * @param {Function} iterator
 * @return {Boolean}
 */
Model.prototype.some = function(iterator) {
  const keys = Object.keys(this.data);
  const len = keys.length;
  let num = 0;

  if (!len) return false;

  for (let i = 0; i < len; i++) {
    const data = this.findById(keys[i]);

    if (data) {
      if (iterator(data, num++)) return true;
    }
  }

  return false;
};

/**
 * Returns a getter function for normal population.
 *
 * @param {Object} data
 * @param {Model} model
 * @param {Object} options
 * @return {Function}
 * @private
 */
Model.prototype._populateGetter = (data, model, options) => {
  let hasCache = false;
  let cache;

  return () => {
    if (!hasCache) {
      cache = model.findById(data);
      hasCache = true;
    }

    return cache;
  };
};

/**
 * Returns a getter function for array population.
 *
 * @param {Object} data
 * @param {Model} model
 * @param {Object} options
 * @return {Function}
 * @private
 */
Model.prototype._populateGetterArray = (data, model, options) => {
  const Query = model.Query;
  let hasCache = false;
  let cache;

  return () => {
    if (!hasCache) {
      let arr = [];

      for (let i = 0, len = data.length; i < len; i++) {
        arr.push(model.findById(data[i]));
      }

      if (options.match) {
        cache = new Query(arr).find(options.match, options);
      } else if (options.skip) {
        if (options.limit) {
          arr = arr.slice(options.skip, options.skip + options.limit);
        } else {
          arr = arr.slice(options.skip);
        }

        cache = new Query(arr);
      } else if (options.limit) {
        cache = new Query(arr.slice(0, options.limit));
      } else {
        cache = new Query(arr);
      }

      if (options.sort) {
        cache = cache.sort(options.sort);
      }

      hasCache = true;
    }

    return cache;
  };
};

/**
 * Populates document references with a compiled stack.
 *
 * @param {Object} data
 * @param {Array} stack
 * @return {Object}
 * @private
 */
Model.prototype._populate = function(data, stack) {
  const models = this._database._models;

  for (let i = 0, len = stack.length; i < len; i++) {
    const item = stack[i];
    const model = models[item.model];

    if (!model) {
      throw new PopulationError('Model `' + item.model + '` does not exist');
    }

    const path = item.path;
    const prop = getProp(data, path);

    if (isArray(prop)) {
      setGetter(data, path, this._populateGetterArray(prop, model, item));
    } else {
      setGetter(data, path, this._populateGetter(prop, model, item));
    }
  }

  return data;
};

/**
 * Populates document references.
 *
 * @param {String|Object} path
 * @return {Query}
 */
Model.prototype.populate = function(path) {
  if (!path) throw new TypeError('path is required');

  const stack = this.schema._parsePopulate(path);
  const arr = new Array(this.length);

  this.forEach((item, i) => {
    arr[i] = this._populate(item, stack);
  });

  return new Query(arr);
};

/**
 * Imports data.
 *
 * @param {Array} arr
 * @private
 */
Model.prototype._import = function(arr) {
  const len = arr.length;
  const data = this.data;
  const schema = this.schema;

  for (let i = 0; i < len; i++) {
    const item = arr[i];
    data[item._id] = schema._parseDatabase(item);
  }

  this.length = len;
};

/**
 * Exports data.
 *
 * @return {String}
 * @private
 */
Model.prototype._export = function() {
  return JSON.stringify(this);
};

Model.prototype.toJSON = function() {
  return this.map(item => this.schema._exportDatabase(item), {lean: true});
};

module.exports = Model;
