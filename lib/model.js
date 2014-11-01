'use strict';

var EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  Promise = require('bluebird'),
  util = require('./util'),
  Document = require('./document'),
  Query = require('./query'),
  Schema = require('./schema'),
  Types = require('./types'),
  WarehouseError = require('./error'),
  PopulationError = require('./error/population');

var callbackWrapper = util.callbackWrapper,
  parseArgs = util.parseArgs,
  reverse = util.reverse,
  shuffle = util.shuffle,
  getProp = util.getProp,
  setGetter = util.setGetter,
  extend = util.extend;

/**
 * Model constructor.
 *
 * @class Model
 * @param {String} name Model name
 * @param {Schema|Object} [schema] Schema
 * @constructor
 * @extends EventEmitter
 * @module warehouse
 */
function Model(name, schema_){
  EventEmitter.call(this);

  var schema, i, len, key;

  // Define schema
  if (schema_ instanceof Schema){
    schema = schema_;
  } else if (typeof schema_ === 'object'){
    schema = new Schema(schema_);
  } else {
    schema = new Schema();
  }

  // Set `_id` path for schema
  if (schema.path('_id') == null){
    schema.path('_id', {type: Types.CUID});
  }

  /**
   * Model name.
   *
   * @property {String} name
   * @private
   */
  this.name = name;

  /**
   * Data storage.
   *
   * @property {Object} data
   * @private
   */
  this.data = {};

  /**
   * Schema.
   *
   * @property {Schema} schema
   * @private
   */
  this.schema = schema;

  /**
   * The number of documents in model.
   *
   * @property {Number} length
   * @readOnly
   */
  this.length = 0;

  /**
   * Document constructor for this model instance.
   *
   * @property {Function} Document
   * @param {Object} data
   * @constructor
   * @private
   */
  var _Document = this.Document = function(data){
    Document.call(this, data);

    // Apply getters
    var err = schema._applyGetters(this);
    if (err) throw err;
  };

  util.inherits(_Document, Document);
  _Document.prototype._model = this;
  _Document.prototype._schema = schema;

  /**
   * Query constructor for this model instance.
   *
   * @property {Function} Query
   * @param {Array} data
   * @constructor
   * @private
   */
  var _Query = this.Query = function(data){
    Query.call(this, data);
  };

  util.inherits(_Query, Query);
  _Query.prototype._model = this;
  _Query.prototype._schema = schema;

  // Apply static methods
  var statics = schema.statics,
    staticKeys = Object.keys(statics);

  for (i = 0, len = staticKeys.length; i < len; i++){
    key = staticKeys[i];
    this[key] = statics[key];
  }

  // Apply instance methods
  var methods = schema.methods,
    methodKeys = Object.keys(methods);

  for (i = 0, len = methodKeys.length; i < len; i++){
    key = methodKeys[i];
    _Document.prototype[key] = methods[key];
  }
}

util.inherits(Model, EventEmitter);

/**
 * Creates a new document.
 *
 * @method new
 * @param {Object} data
 * @return {Document}
 */
Model.prototype.new = function(data){
  return new this.Document(data);
};

/**
 * Finds a document by its identifier.
 *
 * @method findById
 * @param {*} id
 * @param {Object} options
 * @param {Boolean} [options.lean=false] Returns a plain JavaScript object
 * @return {Document|Object}
 */
Model.prototype.findById = function(id, options_){
  var raw = this.data[id];
  if (!raw) return;

  var options = extend({
    lean: false
  }, options_);

  var data = _.cloneDeep(raw);
  return options.lean ? data : this.new(data);
};

/**
 * An alias for {% crosslink Model.findById %}.
 *
 * @method get
 */
Model.prototype.get = Model.prototype.findById;

function execHooks(hooks, data){
  return Promise.map(hooks, function(hook){
    return hook(data);
  }).then(function(){
    return data;
  });
}

/**
 * Inserts a document.
 *
 * @method insertOne
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.insertOne = function(data_, cb){
  var self = this,
    schema = this.schema,
    callback = callbackWrapper(cb);

  var promise = new Promise(function(resolve, reject) {
    // Apply getters
    var data = data_ instanceof self.Document ? data_ : self.new(data_),
      id = data._id;

    // Check ID
    if (!id) {
      return reject(new WarehouseError('ID is not defined'));
    }

    if (self.data[id]) {
      return reject(new WarehouseError('ID `' + id + '` has been used'));
    }

    resolve(data);
  }).then(function(data){ // Pre-hooks
    var hooks = schema.hooks.pre.save;
    return hooks.length ? execHooks(hooks, data) : data;
  }).then(function(data){ // Apply setters & inserts data
    var result = data.toObject(),
      err = schema._applySetters(result);

    if (err) return Promise.reject(err);

    self.data[data._id] = result;
    self.length++;

    /**
     * Fired when a document is inserted
     *
     * @event insert
     */
    self.emit('insert', data);

    return data;
  }).nodeify(callback);

  // Post-hooks
  promise.then(function(data){
    var hooks = schema.hooks.post.save;
    return hooks.length ? execHooks(hooks, data) : data;
  });

  return promise;
};

/**
 * Inserts documents.
 *
 * @method insert
 * @param {Object|Array} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.insert = function(data, cb){
  if (Array.isArray(data)){
    var callback = callbackWrapper(cb),
      self = this;

    return Promise.map(data, function(item){
      return self.insertOne(item);
    }).nodeify(callback);
  } else {
    return this.insertOne(data, cb);
  }
};

/**
 * Saves a document.
 *
 * @method save
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.save = function(data, cb){
  var id = data._id;

  if (id && this.data[id]){
    return this.replaceById(id, data, cb);
  } else {
    return this.insertOne(data, cb);
  }
};

/**
 * Updates a document with a compiled stack.
 *
 * @method _updateWithStack
 * @param {*} id
 * @param {Array} stack
 * @return {Promise}
 * @private
 */
Model.prototype._updateWithStack = function(id, stack){
  var self = this,
    schema = self.schema;

  var promise = new Promise(function(resolve, reject){
    var data = self.data[id];

    if (!data){
      return reject(new WarehouseError('ID `' + id + '` does not exist'));
    }

    // Clone data
    var result = _.cloneDeep(data);

    // Update
    for (var i = 0, len = stack.length; i < len; i++){
      stack[i](result);
    }

    // Apply getters
    var doc = self.new(result);

    resolve(doc);
  }).then(function(data){ // Pre-hooks
    var hooks = schema.hooks.pre.save;
    return hooks.length ? execHooks(hooks, data) : data;
  }).then(function(data){ // Apply setters & updates data
    // Apply setters
    var result = data.toObject(),
      err = schema._applySetters(result);

    if (err) return Promise.reject(err);

    // Update data
    self.data[id] = result;

    /**
     * Fired when a document is updated
     *
     * @event updte
     */
    self.emit('update', data);
    return data;
  });

  // Post-hooks
  promise.then(function(data){
    var hooks = schema.hooks.post.save;
    return hooks.length ? execHooks(hooks, data) : data;
  });

  return promise;
};

/**
 * Finds a document by its identifier and update it.
 *
 * @method updateById
 * @param {*} id
 * @param {Object} update
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.updateById = function(id, update, cb){
  var stack = this.schema._parseUpdate(update),
    callback = callbackWrapper(cb);

  return this._updateWithStack(id, stack).nodeify(callback);
};

/**
 * Updates matching documents.
 *
 * @method update
 * @param {Object} query
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.update = function(query, data, cb){
  return this.find(query).update(data, cb);
};

/**
 * Finds a document by its identifier and replace it.
 *
 * @method replaceById
 * @param {*} id
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.replaceById = function(id, data_, cb){
  var self = this,
    schema = this.schema,
    callback = callbackWrapper(cb);

  var promise = new Promise(function(resolve, reject){
    if (!self.data[id]){
      return reject(new WarehouseError('ID `' + id + '` does not exist'));
    }

    data_._id = id;

    // Apply getters
    var data = data instanceof self.Document ? data_ : self.new(data_);

    resolve(data);
  }).then(function(data){ // Pre-hooks
    var hooks = schema.hooks.pre.save;
    return hooks.length ? execHooks(hooks, data) : data;
  }).then(function(data){
    // Apply setters
    var result = data.toObject(),
      err = schema._applySetters(result);

    if (err) return Promise.reject(err);

    // Replace data
    self.data[id] = result;

    self.emit('update', data);
    return data;
  }).nodeify(callback);

  // Post-hooks
  promise.then(function(data){
    var hooks = schema.hooks.post.save;
    return hooks.length ? execHooks(hooks, data) : data;
  });

  return promise;
};

/**
 * Replaces matching documents.
 *
 * @method replace
 * @param {Object} query
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.replace = function(query, data, cb){
  return this.find(query).replace(data, cb);
};

/**
 * Finds a document by its identifier and remove it.
 *
 * @method removeById
 * @param {*} id
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.removeById = function(id, cb){
  var callback = callbackWrapper(cb),
    self = this,
    schema = this.schema;

  var promise = new Promise(function(resolve, reject){
    var data = self.data[id];

    if (!data){
      return reject(new WarehouseError('ID `' + id + '` does not exist'));
    }

    resolve(data);
  }).then(function(data){ // Pre-hooks
    var hooks = schema.hooks.pre.remove;
    return hooks.length ? execHooks(hooks, data) : data;
  }).then(function(data){ // Removes data
    self.data[id] = null;
    self.length--;

    /**
     * Fired when a document is removed
     *
     * @event remove
     */
    self.emit('remove', data);
    return data;
  }).nodeify(callback);

  // Post-hooks
  promise.then(function(data){
    var hooks = schema.hooks.post.remove;
    return hooks.length ? execHooks(hooks, data) : data;
  });

  return promise;
};

/**
 * Removes matching documents.
 *
 * @method remove
 * @param {Object} query
 * @param {Object} [callback]
 * @return {Promise}
 */
Model.prototype.remove = function(query, cb){
  return this.find(query).remove(cb);
};

/**
 * Deletes a model.
 *
 * @method destroy
 */
Model.prototype.destroy = function(){
  this._database._models[this.name] = null;
};

/**
 * Returns the number of elements.
 *
 * @method count
 * @return {Number}
 */
Model.prototype.count = function(){
  return this.length;
};

/**
 * An alias for {% crosslink Model.size %}
 *
 * @method size
 */
Model.prototype.size = Model.prototype.count;

/**
 * Iterates over all documents.
 *
 * @method forEach
 * @param {Function} iterator
 * @param {Object} [options] See {% crosslink Model.findById %}.
 */
Model.prototype.forEach = function(iterator, options){
  var keys = Object.keys(this.data),
    num = 0,
    data;

  for (var i = 0, len = keys.length; i < len; i++){
    data = this.findById(keys[i], options);
    if (data) iterator(data, num++);
  }
};

/**
 * An alias for {% crosslink Model.forEach %}.
 *
 * @method each
 */
Model.prototype.each = Model.prototype.forEach;

/**
 * Returns an array containing all documents.
 *
 * @method toArray
 * @param {Object} [options] See {% crosslink Model.findById %}.
 * @return {Array}
 */
Model.prototype.toArray = function(options){
  var result = new Array(this.length);

  this.forEach(function(item, i){
    result[i] = item;
  }, options);

  return result;
};

/**
 * Finds matching documents.
 *
 * @method find
 * @param {Object} query
 * @param {Object} [options]
 *   @param {Number} [options.limit=0] Limits the number of documents returned.
 *   @param {Number} [options.skip=0] Skips the first elements.
 *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
 * @return {Query|Array}
 */
Model.prototype.find = function(query, options_){
  var options = options_ || {},
    filter = this.schema._execQuery(query),
    keys = Object.keys(this.data),
    len = this.length,
    limit = options.limit || len,
    arr = [],
    key, item;

  for (var i = 0; limit && i < len; i++, limit--){
    key = keys[i];
    item = this.findById(key, options);

    if (item && filter(item)){
      arr.push(item);
    }
  }

  if (options.skip > 0) arr = arr.slice(options.skip);

  return options.lean ? arr : new this.Query(arr);
};

/**
 * Finds the first matching documents.
 *
 * @method findOne
 * @param {Object} query
 * @param {Object} [options]
 *   @param {Number} [options.skip=0] Skips the first elements.
 *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
 * @return {Document|Object}
 */
Model.prototype.findOne = function(query, options_){
  var options = options_ || {};
  options.limit = 1;

  var result = this.find(query, options);
  return options.lean ? result[0] : result.first();
};

/**
 * Sorts documents. See {% crosslink Query.sort %}.
 *
 * @method sort
 * @param {String|Object} orderby
 * @param {String|Number} [order]
 * @return {Query}
 */
Model.prototype.sort = function(orderby, order){
  var sort = parseArgs(orderby, order),
    fn = this.schema._execSort(sort);

  return new this.Query(this.toArray().sort(fn));
};

/**
 * Returns the document at the specified index. `num` can be a positive or
 * negative number.
 *
 * @method eq
 * @param {Number} i
 * @param {Object} [options] See {% crosslink Model.findById %}.
 * @return {Document|Object}
 */
Model.prototype.eq = function(i, options){
  var index = i < 0 ? this.length + i : i,
    keys = Object.keys(this.data),
    data;

  while (!data){
    data = this.findById(keys[index++], options);
  }

  return data;
};

/**
 * Returns the first document.
 *
 * @method first
 * @param {Object} [options] See {% crosslink Model.findById %}.
 * @return {Document|Object}
 */
Model.prototype.first = function(options){
  return this.eq(0, options);
};

/**
 * Returns the last document.
 *
 * @method first
 * @param {Object} [options] See {% crosslink Model.findById %}.
 * @return {Document|Object}
 */
Model.prototype.last = function(options){
  return this.eq(-1, options);
};

/**
 * Returns the specified range of documents.
 *
 * @method slice
 * @param {Number} start
 * @param {Number} [end]
 * @return {Query}
 */
Model.prototype.slice = function(start_, end_){
  var total = this.length;

  var start = start_ | 0;
  if (start < 0) start += total;

  var end = end_ || total;
  if (end < 0) end += total;

  var len = end - start;
  if (len > total) len = total - start;

  var arr = new Array(len),
    keys = Object.keys(this.data),
    num = 0,
    data;

  for (var i = start; num < len && i < total; i++){
    data = this.findById(keys[i]);
    if (data) arr[num++] = data;
  }

  return new this.Query(arr);
};

/**
 * Limits the number of documents returned.
 *
 * @method limit
 * @param {Number} i
 * @return {Query}
 */
Model.prototype.limit = function(i){
  return this.slice(0, i);
};

/**
 * Specifies the number of items to skip.
 *
 * @method skip
 * @param {Number} i
 * @return {Query}
 */
Model.prototype.skip = function(i){
  return this.slice(i);
};

/**
 * Returns documents in a reversed order.
 *
 * @method reverse
 * @return {Query}
 */
Model.prototype.reverse = function(){
  return new this.Query(reverse(this.toArray()));
};

/**
 * Returns documents in random order.
 *
 * @method shuffle
 * @return {Query}
 */
Model.prototype.shuffle = function(){
  return new this.Query(shuffle(this.toArray()));
};

/**
 * An alias for {% crosslink Model.shuffle %}.
 *
 * @method random
 */
Model.prototype.random = Model.prototype.shuffle;

/**
 * Creates an array of values by iterating each element in the collection.
 *
 * @method map
 * @param {Function} iterator
 * @param {Object} [options]
 * @return {Array}
 */
Model.prototype.map = function(iterator, options){
  var result = new Array(this.length);

  this.forEach(function(item, i){
    result[i] = iterator(item, i);
  }, options);

  return result;
};

/**
 * Reduces a collection to a value which is the accumulated result of iterating
 * each element in the collection.
 *
 * @method reduce
 * @param {Function} iterator
 * @param {*} [initial] By default, the initial value is the first document.
 * @return {*}
 */
Model.prototype.reduce = function(iterator, initial){
  var arr = this.toArray(),
    len = this.length,
    i, result;

  if (initial === undefined){
    i = 1;
    result = arr[0];
  } else {
    i = 0;
    result = initial;
  }

  for (; i < len; i++){
    result = iterator(result, arr[i], i);
  }

  return result;
};

/**
 * Reduces a collection to a value which is the accumulated result of iterating
 * each element in the collection from right to left.
 *
 * @method reduce
 * @param {Function} iterator
 * @param {*} [initial] By default, the initial value is the last document.
 * @return {*}
 */
Model.prototype.reduceRight = function(iterator, initial){
  var arr = this.toArray(),
    len = this.length,
    i, result;

  if (initial === undefined){
    i = len - 2;
    result = arr[len - 1];
  } else {
    i = len - 1;
    result = initial;
  }

  for (; i >= 0; i--){
    result = iterator(result, arr[i], i);
  }

  return result;
};

/**
 * Creates a new array with all documents that pass the test implemented by the
 * provided function.
 *
 * @method filter
 * @param {Function} iterator
 * @param {Object} [options]
 * @return {Query}
 */
Model.prototype.filter = function(iterator, options){
  var arr = [];

  this.forEach(function(item, i){
    if (iterator(item, i)) arr.push(item);
  }, options);

  return new this.Query(arr);
};

/**
 * Returns a getter function for normal population.
 *
 * @method _populateGetter
 * @param {Object} data
 * @param {Model} model
 * @param {Object} options
 * @return {Function}
 * @private
 */
Model.prototype._populateGetter = function(data, model, options){
  var hasCache = false,
    cache;

  return function(){
    if (!hasCache){
      cache = model.findById(data);
      hasCache = true;
    }

    return cache;
  };
};

/**
 * Returns a getter function for array population.
 *
 * @method _populateGetterArray
 * @param {Object} data
 * @param {Model} model
 * @param {Object} options
 * @return {Function}
 * @private
 */
Model.prototype._populateGetterArray = function(data, model, options){
  var Query = this.Query,
    hasCache = false,
    cache;

  return function(){
    if (!hasCache){
      var arr;

      for (var i = 0, len = data.length; i < len; i++){
        arr.push(model.findById(data[i]));
      }

      cache = new Query(arr);

      if (options.match){
        cache = cache.find(options.match);
      }

      if (options.sort){
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
 * @method _populate
 * @param {Object} data
 * @param {Array} stack
 * @return {Object}
 * @private
 */
Model.prototype._populate = function(data, stack){
  var models = this._database._models,
    item, model, path, prop;

  for (var i = 0, len = stack.length; i < len; i++){
    item = stack[i];
    model = models[item.model];

    if (!model){
      throw new PopulationError('Model `' + item.model + '` does not exist');
    }

    path = item.path;
    prop = getProp(data, path);

    if (Array.isArray(prop)){
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
 * @method populate
 * @param {String|Object} expr
 * @return {Query}
 */
Model.prototype.populate = function(expr){
  var stack = this.schema._parsePopulate(expr),
    arr = new Array(this.length),
    self = this;

  this.forEach(function(item, i){
    arr[i] = self._populate(item, stack);
  });

  return new Query(arr);
};

/**
 * Imports data.
 *
 * @method _import
 * @param {Array} arr
 * @private
 */
Model.prototype._import = function(arr){
  var len = arr.length,
    data = this.data,
    schema = this.schema,
    item;

  for (var i = 0; i < len; i++){
    item = arr[i];
    data[item._id] = schema._parseDatabase(item);
  }

  this.length = len;
};

/**
 * Exports data.
 *
 * @method _export
 * @return {String}
 * @private
 */
Model.prototype._export = function(){
  var arr = new Array(this.length),
    schema = this.schema;

  this.forEach(function(item, i){
    arr[i] = schema._exportDatabase(item);
  }, {lean: true});

  return JSON.stringify(arr);
};

module.exports = Model;