'use strict';

var EventEmitter = require('events').EventEmitter,
  fast = require('fast.js'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  util = require('./util'),
  Document = require('./document'),
  Query = require('./query'),
  Schema = require('./schema'),
  Types = require('./types'),
  WarehouseError = require('./error');

function Model(name, schema_){
  EventEmitter.call(this);

  var schema, _Document, _Query, statics, staticKeys, methods, methodKeys, i, len, key;

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

  this.name = name;
  this.data = {};
  this.schema = schema;
  this.length = 0;

  // Define a document class for this model instance
  _Document = this.Document = function(data){
    Document.call(this, data);

    // Apply getters
    var err = schema._applyGetters(this);
    if (err) throw err;
  };

  util.inherits(_Document, Document);
  _Document.prototype._model = this;

  // Define a query clsas for this model instance
  _Query = this.Query = function(data){
    Query.call(this, data);
  };

  util.inherits(_Query, Query);
  _Query.prototype._model = this;
  _Query.prototype._schema = schema;

  // Apply static methods
  statics = schema.statics;
  staticKeys = Object.keys(statics);

  for (i = 0, len = staticKeys.length; i < len; i++){
    key = staticKeys[i];
    this[key] = statics[key];
  }

  // Apply instance methods
  methods = schema.methods;
  methodKeys = Object.keys(methods);

  for (i = 0, len = methodKeys.length; i < len; i++){
    key = methodKeys[i];
    _Document.prototype[key] = methods[key];
  }
}

util.inherits(Model, EventEmitter);

Model.prototype.new = function(data){
  return new this.Document(data);
};

Model.prototype.findById = function(id, options_){
  var raw = this.data[id];
  if (raw == null) return;

  var options = fast.assign({
    lean: false
  }, options_);

  var data = _.cloneDeep(raw);
  return options.lean ? data : this.new(data);
};

Model.prototype.get = Model.prototype.findById;

Model.prototype.insertOne = function(data_, cb){
  var self = this,
    callback = util.callbackWrapper(cb);

  return new Promise(function(resolve, reject){
    var data = data_ instanceof self.Document ? data_ : self.new(data_),
      id = data._id,
      result, err;

    // Check ID
    if (id == null) return reject(new WarehouseError('ID is not defined'));
    if (self.data[id] != null) return reject(new WarehouseError('ID `' + id + '` has been used'));

    // Apply setters
    result = data.toObject();
    err = self.schema._applySetters(result);
    if (err) return reject(err);

    // Insert data
    self.data[id] = result;
    self.length++;

    // Return data
    resolve(data);
    self.emit('insert', data);
  }).nodeify(callback);
};

Model.prototype.insert = function(data, cb){
  if (Array.isArray(data)){
    var callback = util.callbackWrapper(cb),
      self = this;

    return Promise.map(data, function(item){
      return self.insertOne(item);
    }).nodeify(callback);
  } else {
    return this.insertOne(data, cb);
  }
};

Model.prototype.save = function(data, cb){
  var id = data._id;

  if (id && this.data[id]){
    return this.replaceById(id, data, cb);
  } else {
    return this.insertOne(data, cb);
  }
};

Model.prototype.updateById = function(id, update, cb){
  var self = this,
    callback = util.callbackWrapper(cb);

  return new Promise(function(resolve, reject){
    var data = self.data[id],
      result, doc, stack, err;

    if (data == null){
      return reject(new WarehouseError('ID `' + id + '` does not exist'));
    }

    // Parse
    stack = self.schema._parseUpdate(update);
    result = _.cloneDeep(data);

    // Update
    for (var i = 0, len = stack.length; i < len; i++){
      stack[i](result);
    }

    // Apply getters
    doc = self.new(result);
    result = doc.toObject();

    // Apply setters
    err = self.schema._applySetters(result);
    if (err) return reject(err);

    // Update
    self.data[id] = result;

    // Return data
    resolve(doc);
    self.emit('update', doc);
  }).nodeify(callback);
};

Model.prototype.update = function(query, data, cb){
  return this.find(query).update(data, cb);
};

Model.prototype.replaceById = function(id, data_, cb){
  var self = this,
    callback = util.callbackWrapper(cb);

  return new Promise(function(resolve, reject){
    if (self.data[id] == null){
      return reject(new WarehouseError('ID `' + id + '` does not exist'));
    }

    data_._id = id;

    // Apply getters
    var data = data_ instanceof self.Document ? data_ : self.new(data_),
      result = data.toObject();

    // Apply setters
    var err = self.schema._applySetters(result);
    if (err) return reject(err);

    // Replace data
    self.data[id] = result;

    // Return data
    resolve(data);
    self.emit('update', data);
  }).nodeify(callback);
};

Model.prototype.replace = function(query, data, cb){
  return this.find(query).replace(data, cb);
};

Model.prototype.removeById = function(id, cb){
  var callback = util.callbackWrapper(cb),
    self = this;

  return new Promise(function(resolve, reject){
    if (self.data[id] == null){
      return reject(new WarehouseError('ID `' + id + '` does not exist'));
    }

    var data = self.findById(id);

    self.data[id] = null;
    self.length--;
    resolve(data);
    self.emit('remove', data);
  }).nodeify(callback);
};

Model.prototype.remove = function(query, cb){
  return this.find(query).remove(cb);
};

Model.prototype.count = function(){
  return this.length;
};

Model.prototype.size = Model.prototype.count;

Model.prototype.forEach = function(iterator, options){
  var keys = Object.keys(this.data);

  for (var i = 0, len = keys.length; i < len; i++){
    iterator(this.findById(keys[i], options), i);
  }
};

Model.prototype.each = Model.prototype.forEach;

Model.prototype.toArray = function(options){
  var result = new Array(this.length);

  this.forEach(function(item){
    result.push(item);
  }, options);

  return result;
};

Model.prototype.find = function(query, options){
  var filter = this.schema._execQuery(query),
    keys = Object.keys(this.data),
    i = 0,
    len = this.length,
    limit = options.limit || len,
    arr = [],
    key, item;

  for (; limit && i < len; i++, limit--){
    key = keys[i];
    item = this.findById(key, options);

    if (filter(item)){
      arr.push(item);
    }
  }

  return new this.Query(arr);
};

Model.prototype.findOne = function(query, options){
  return this.find(query, fast.assign({
    limit: 1
  }, options)).first();
};

Model.prototype.sort = function(orderby, order){
  var sort = util.parseSortArgs(orderby, order),
    fn = this.schema._execSort(sort);

  return new this.Query(this.toArray().sort(fn));
};

Model.prototype.eq = function(i, options){
  var index = i < 0 ? this.length + i : i,
    keys = Object.keys(this.data);

  return this.findById(keys[index], options);
};

Model.prototype.first = function(options){
  return this.eq(0, options);
};

Model.prototype.last = function(options){
  return this.eq(-1, options);
};

Model.prototype.slice = function(start, end){
  var index = Object.keys(this.data).slice(start, end),
    len = index.length,
    arr = new Array(len);

  for (var i = 0; i < len; i++){
    arr[i] = this.findById(index[i]);
  }

  return new this.Query(arr);
};

Model.prototype.limit = function(i){
  return this.slice(0, i);
};

Model.prototype.skip = function(i){
  return this.slice(i);
};

Model.prototype.reverse = function(){
  var index = util.reverse(Object.keys(this.data)),
    len = this.length,
    arr = new Array(len);

  for (var i = 0; i < len; i++){
    arr[i] = this.findById(index[i]);
  }

  return new this.Query(arr);
};

Model.prototype.shuffle = function(){
  var index = util.shuffle(Object.keys(this.data)),
    len = this.length,
    arr = new Array(len);

  for (var i = 0; i < len; i++){
    arr[i] = this.findById(index[i]);
  }

  return new this.Query(arr);
};

Model.prototype.random = Model.prototype.shuffle;

Model.prototype.map = function(iterator){
  var result = new Array(this.length),
    keys = Object.keys(this.data);

  for (var i = 0, len = this.length; i < len; i++){
    result[i] = iterator(this.findById(keys[i]), i);
  }

  return result;
};

Model.prototype.reduce = function(iterator, initial){
  var keys = Object.keys(this.data),
    i, result;

  if (initial === undefined){
    i = 1;
    result = this.first();
  } else {
    i = 0;
    result = initial;
  }

  for (var len = this.length; i < len; i++){
    result = iterator(this.findById(keys[i]), i);
  }

  return result;
};

Model.prototype.reduceRight = function(iterator, initial){
  var keys = Object.keys(this.data),
    len = this.length,
    i, result;

  if (initial === undefined){
    i = len - 2;
    result = this.last();
  } else {
    i = len - 1;
    result = initial;
  }

  for (; i >= 0; i--){
    result = iterator(result, this.findById(keys[i]), i);
  }

  return result;
};

Model.prototype.filter = function(iterator, options){
  var keys = Object.keys(this.data),
    arr = [],
    key, item;

  for (var i = 0, len = this.length; i < len; i++){
    key = keys[i];
    item = this.findById(key, options);

    if (iterator(item, i)){
      arr.push(item);
    }
  }

  return new this.Query(arr);
};

module.exports = Model;