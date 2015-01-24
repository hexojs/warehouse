'use strict';

var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('./util');
var Document = require('./document');
var Query = require('./query');
var Schema = require('./schema');
var Types = require('./types');
var WarehouseError = require('./error');
var PopulationError = require('./error/population');
var Queue = require('./queue');

var parseArgs = util.parseArgs;
var reverse = util.reverse;
var shuffle = util.shuffle;
var getProp = util.getProp;
var setGetter = util.setGetter;
var extend = util.extend;
var isArray = Array.isArray;

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
  if (!schema.path('_id')){
    schema.path('_id', {type: Types.CUID, required: true});
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
   * Promise queue.
   *
   * @property {Queue} _queue
   * @private
   */
  this._queue = new Queue();

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
  var statics = schema.statics;
  var staticKeys = Object.keys(statics);

  for (i = 0, len = staticKeys.length; i < len; i++){
    key = staticKeys[i];
    this[key] = statics[key];
  }

  // Apply instance methods
  var methods = schema.methods;
  var methodKeys = Object.keys(methods);

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

function execHooks(schema, type, event, data){
  var hooks = schema.hooks[type][event];
  if (!hooks.length) return Promise.resolve(data);

  return Promise.each(hooks, function(hook){
    return hook(data);
  }).thenReturn(data);
}

/**
 * Inserts a document.
 *
 * @method insertOne
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.insertOne = function(data_, callback){
  var self = this;
  var schema = this.schema;
  var result;

  return this._queue.push(function(){
    return new Promise(function(resolve, reject) {
      // Apply getters
      var data = data_ instanceof self.Document ? data_ : self.new(data_);
      var id = data._id;

      // Check ID
      if (!id) {
        return reject(new WarehouseError('ID is not defined'));
      }

      if (self.data[id]) {
        return reject(new WarehouseError('ID `' + id + '` has been used'));
      }

      resolve(data);
    }).then(function(data){
      // Apply setters
      result = data.toObject();
      var err = schema._applySetters(result);

      if (err) return Promise.reject(err);

      // Pre-hooks
      return execHooks(schema, 'pre', 'save', data);
    }).then(function(data){
      // Insert data
      self.data[data._id] = result;
      self.length++;

      /**
       * Fired when a document is inserted
       *
       * @event insert
       */
      self.emit('insert', data);
      return data;
    }).then(function(data){
      return execHooks(schema, 'post', 'save', data);
    });
  }).nodeify(callback);
};

/**
 * Inserts documents.
 *
 * @method insert
 * @param {Object|Array} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.insert = function(data, callback){
  if (isArray(data)){
    var self = this;

    return Promise.map(data, function(item){
      return self.insertOne(item);
    }).nodeify(callback);
  } else {
    return this.insertOne(data, callback);
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
Model.prototype.save = function(data, callback){
  var id = data._id;

  if (id && this.data[id]){
    return this.replaceById(id, data, callback);
  } else {
    return this.insertOne(data, callback);
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
  var self = this;
  var schema = self.schema;
  var result;

  return this._queue.push(function(){
    return new Promise(function(resolve, reject){
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
    }).then(function(data){
      // Apply setters
      result = data.toObject();
      var err = schema._applySetters(result);

      if (err) return Promise.reject(err);

      // Pre-hooks
      return execHooks(schema, 'pre', 'save', data);
    }).then(function(data){
      // Update data
      self.data[id] = result;

      /**
       * Fired when a document is updated
       *
       * @event updte
       */
      self.emit('update', data);
      return data;
    }).then(function(data){
      return execHooks(schema, 'post', 'save', data);
    });
  });
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
Model.prototype.updateById = function(id, update, callback){
  var stack = this.schema._parseUpdate(update);

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
Model.prototype.update = function(query, data, callback){
  return this.find(query).update(data, callback);
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
Model.prototype.replaceById = function(id, data_, callback){
  var self = this;
  var schema = this.schema;
  var result;

  return this._queue.push(function(){
    return new Promise(function(resolve, reject){
      if (!self.data[id]){
        return reject(new WarehouseError('ID `' + id + '` does not exist'));
      }

      data_._id = id;

      // Apply getters
      var data = data instanceof self.Document ? data_ : self.new(data_);

      resolve(data);
    }).then(function(data){
      // Apply setters
      result = data.toObject();
      var err = schema._applySetters(result);

      if (err) return Promise.reject(err);

      // Pre-hooks
      return execHooks(schema, 'pre', 'save', data);
    }).then(function(data){
      // Replace data
      self.data[id] = result;

      self.emit('update', data);
      return data;
    }).then(function(data){
      return execHooks(schema, 'post', 'save', data);
    });
  }).nodeify(callback);
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
Model.prototype.replace = function(query, data, callback){
  return this.find(query).replace(data, callback);
};

/**
 * Finds a document by its identifier and remove it.
 *
 * @method removeById
 * @param {*} id
 * @param {Function} [callback]
 * @return {Promise}
 */
Model.prototype.removeById = function(id, callback){
  var self = this;
  var schema = this.schema;

  return this._queue.push(function(){
    return new Promise(function(resolve, reject){
      var data = self.data[id];

      if (!data){
        return reject(new WarehouseError('ID `' + id + '` does not exist'));
      }

      resolve(data);
    }).then(function(data){ // Pre-hooks
      return execHooks(schema, 'pre', 'remove', data);
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
    }).then(function(data){
      return execHooks(schema, 'post', 'remove', data);
    });
  }).nodeify(callback);
};

/**
 * Removes matching documents.
 *
 * @method remove
 * @param {Object} query
 * @param {Object} [callback]
 * @return {Promise}
 */
Model.prototype.remove = function(query, callback){
  return this.find(query).remove(callback);
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
  var keys = Object.keys(this.data);
  var num = 0;
  var data;

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
  var options = options_ || {};
  var filter = this.schema._execQuery(query);
  var keys = Object.keys(this.data);
  var len = keys.length;
  var limit = options.limit || this.length;
  var skip = options.skip;
  var data = this.data;
  var arr = [];
  var key, item;

  for (var i = 0; limit && i < len; i++){
    key = keys[i];
    item = data[key];

    if (item && filter(item)){
      if (skip){
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
  return options.lean ? result[0] : result.data[0];
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
  var sort = parseArgs(orderby, order);
  var fn = this.schema._execSort(sort);

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
Model.prototype.eq = function(i_, options){
  var index = i_ < 0 ? this.length + i_ : i_;
  var data = this.data;
  var keys = Object.keys(data);
  var key, item;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    item = data[key];

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
  if (start > total - 1) return new this.Query([]);

  var end = end_ | 0 || total;
  if (end < 0) end += total;

  var len = start > end ? 0 : end - start;
  if (len > total) len = total - start;
  if (!len) return new this.Query([]);

  var arr = new Array(len);
  var keys = Object.keys(this.data);
  var keysLen = keys.length;
  var num = 0;
  var data;

  for (var i = 0; num < len && i < keysLen; i++){
    data = this.findById(keys[i]);
    if (!data) continue;

    if (start){
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
  var arr = this.toArray();
  var len = this.length;
  var i, result;

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
  var arr = this.toArray();
  var len = this.length;
  var i, result;

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
 * Tests whether all documents pass the test implemented by the provided
 * function.
 *
 * @method every
 * @param {Function} iterator
 * @return {Boolean}
 */
Model.prototype.every = function(iterator){
  var keys = Object.keys(this.data);
  var len = keys.length;
  var num = 0;
  var data;

  if (!len) return true;

  for (var i = 0; i < len; i++){
    data = this.findById(keys[i]);

    if (data){
      if (!iterator(data, num++)) return false;
    }
  }

  return true;
};

/**
 * Tests whether some documents pass the test implemented by the provided
 * function.
 *
 * @method some
 * @param {Function} iterator
 * @return {Boolean}
 */
Model.prototype.some = function(iterator){
  var keys = Object.keys(this.data);
  var len = keys.length;
  var num = 0;
  var data;

  if (!len) return false;

  for (var i = 0; i < len; i++){
    data = this.findById(keys[i]);

    if (data){
      if (iterator(data, num++)) return true;
    }
  }

  return false;
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
  var hasCache = false;
  var cache;

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
  var Query = model.Query;
  var hasCache = false;
  var cache;

  return function(){
    if (!hasCache){
      var arr = [];

      for (var i = 0, len = data.length; i < len; i++){
        arr.push(model.findById(data[i]));
      }

      if (options.match){
        cache = new Query(arr).find(options.match, options);
      } else if (options.skip){
        if (options.limit){
          arr = arr.slice(options.skip, options.skip + options.limit);
        } else {
          arr = arr.slice(options.skip);
        }

        cache = new Query(arr);
      } else if (options.limit){
        cache = new Query(arr.slice(0, options.limit));
      } else {
        cache = new Query(arr);
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
  var models = this._database._models;
  var item, model, path, prop;

  for (var i = 0, len = stack.length; i < len; i++){
    item = stack[i];
    model = models[item.model];

    if (!model){
      throw new PopulationError('Model `' + item.model + '` does not exist');
    }

    path = item.path;
    prop = getProp(data, path);

    if (isArray(prop)){
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
 * @param {String|Object} path
 * @return {Query}
 */
Model.prototype.populate = function(path){
  if (!path) throw new TypeError('path is required');

  var stack = this.schema._parsePopulate(path);
  var arr = new Array(this.length);
  var self = this;

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
  var len = arr.length;
  var data = this.data;
  var schema = this.schema;
  var item;

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
  var arr = new Array(this.length);
  var schema = this.schema;

  this.forEach(function(item, i){
    arr[i] = schema._exportDatabase(item);
  }, {lean: true});

  return JSON.stringify(arr);
};

module.exports = Model;