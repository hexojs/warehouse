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
    schema._applyGetters(data);
    Document.call(this, data);
  };

  util.inherits(_Document, Document);
  _Document.prototype._model = this;

  // Define a query clsas for this model instance
  _Query = this.Query = function(){
    Query.call(this);
  };

  util.inherits(_Query, Query);
  _Query.prototype._model = this;

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

function callbackWrapper(cb){
  if (typeof cb !== 'function') return;

  return function(err, result){
    if (cb.length < 2){
      if (err != null) throw err;
      cb(result);
    } else {
      cb(err, result);
    }
  };
}

Model.prototype.insertOne = function(data_, cb){
  var self = this,
    callback = callbackWrapper(cb);

  return new Promise(function(resolve, reject){
    // Apply getters
    var data = data_ instanceof self.Document ? data_ : self.new(data_),
      id = data._id,
      result;

    if (self.data[id] != null){
      return reject(new WarehouseError('ID `' + id + '` has been used in model `' + self.name + '`'));
    }

    // Apply setters
    result = self.schema._applySetters(_.cloneDeep(data));

    if (result instanceof Error){
      reject(result);
    } else {
      self.data[id] = result;
      self.length++;
      resolve(data);
      self.emit('insert', data);
    }
  }).nodeify(callback);
};

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

Model.prototype.updateById = function(id, update, cb){
  var self = this,
    callback = callbackWrapper(cb);

  return new Promise(function(resolve, reject){
    var data = self.data[id],
      result, doc;

    if (data == null){
      return reject(new WarehouseError('ID `' + id + '` does not exist in model `' + self.name + '`'));
    }

    // Parse
    result = self.schema._parseUpdate(_.cloneDeep(data), update);
    if (result instanceof Error) return reject(result);

    // Apply getters
    doc = self.new(result);

    // Apply setters
    result = self.schema._applySetters(result);
    if (result instanceof Error) return reject(result);

    // Write changes
    self.data[id] = result;
    resolve(doc);
    self.emit('update', doc);
  }).nodeify(callback);
};

Model.prototype.replaceById = function(id, data_, cb){
  var self = this,
    callback = callbackWrapper(cb);

  return new Promise(function(resolve, reject){
    if (self.data[id] == null){
      return reject(new WarehouseError('ID `' + id + '` does not exist in model `' + self.name + '`'));
    }

    data_._id = id;

    // Apply getters
    var data = data_ instanceof self.Document ? data_ : self.new(data_),
      result;

    // Apply setters
    result = self.schema._applySetters(_.cloneDeep(data));

    if (result instanceof Error){
      reject(result);
    } else {
      self.data[id] = result;
      resolve(data);
      self.emit('update', data);
    }
  }).nodeify(callback);
};

Model.prototype.removeById = function(id, cb){
  var callback = callbackWrapper(cb),
    self = this;

  return new Promise(function(resolve, reject){
    if (self.data[id] == null){
      return reject(new WarehouseError('ID `' + id + '` does not exist in model `' + self.name + '`'));
    }

    self.data[id] = null;
    self.length--;
    resolve();
  }).nodeify(callback);
};

Model.prototype.find = function(query, options){
  //
};

Model.prototype.findOne = function(query, options){
  return this.find(query, fast.assign({
    limit: 1
  }, options));
};

module.exports = Model;