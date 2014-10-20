'use strict';

var fast = require('fast.js'),
  _ = require('lodash'),
  util = require('./util');

function Query(data){
  var len = this.length = data.length,
    index = this.index = new Array(len);

  this.data = data;

  for (var i = 0; i < len; i++){
    index[i] = data[i]._id;
  }
}

Query.prototype.count = function(){
  return this.length;
};

Query.prototype.size = Query.prototype.count;

Query.prototype.forEach = function(iterator){
  var data = this.data;

  for (var i = 0, len = this.length; i < len; i++){
    iterator(data[i], i);
  }
};

Query.prototype.each = Query.prototype.forEach;

Query.prototype.toArray = function(){
  return this.data;
};

Query.prototype.eq = function(i){
  var index = i < 0 ? this.length + i : i;
  return this.data[index];
};

Query.prototype.first = function(){
  return this.eq(0);
};

Query.prototype.last = function(){
  return this.eq(-1);
};

Query.prototype.slice = function(start, end){
  return new this.constructor(this.data.slice(start, end));
};

Query.prototype.limit = function(i){
  return this.slice(0, i);
};

Query.prototype.skip = function(i){
  return this.slice(i);
};

Query.prototype.reverse = function(){
  return new this.constructor(util.reverse(fast.cloneArray(this.data)));
};

Query.prototype.find = function(query, options){
  var filter = this._schema._execQuery(query),
    data = this.data,
    i = 0,
    len = this.length,
    limit = options.limit || len,
    arr = [],
    item;

  for (; limit && i < len; i++, limit--){
    item = data[i];
    if (filter(item)) arr.push(item);
  }

  return new this.constructor(arr);
};

Query.prototype.findOne = function(query, options){
  return this.find(query, fast.assign({
    limit: 1
  }, options)).first();
};

Query.prototype.sort = function(orderby, order){
  var sort = util.parseSortArgs(orderby, order),
    fn = this.schema._execSort(sort);

  return new this.constructor(fast.cloneArray(this.data).sort(fn));
};

Query.prototype.shuffle = function(){
  return new this.constructor(util.shuffle(fast.cloneArray(this.data)));
};

Query.prototype.random = Query.prototype.shuffle;

Query.prototype.map = function(iterator){
  var len = this.length,
    result = new Array(len),
    data = this.data;

  for (var i = 0; i < len; i++){
    result[i] = iterator(data[i], i);
  }

  return result;
};

Query.prototype.reduce = function(iterator, initial){
  var len = this.length,
    data = this.data,
    result, i;

  if (initial === undefined){
    i = 1;
    result = data[0];
  } else {
    i = 0;
    result = initial;
  }

  for (; i < len; i++){
    result = iterator(result, data[i], i);
  }

  return result;
};

Query.prototype.reduceRight = function(iterator, initial){
  var len = this.length,
    data = this.data,
    result, i;

  if (initial === undefined){
    i = len - 2;
    result = data[len - 1];
  } else {
    i = len - 1;
    result = initial;
  }

  for (; i >= 0; i--){
    result = iterator(result, data[i], i);
  }
};

Query.prototype.filter = function(iterator){
  var data = this.data,
    arr = [],
    item;

  for (var i = 0, len = this.length; i < len; i++){
    item = data[i];
    if (iterator(item, i)) arr.push(item);
  }

  return new this.constructor(arr);
};

Query.prototype.update = function(data, cb){
  var callback = util.callbackWrapper(cb),
    model = this._model;

  return Promise.map(this.index, function(id){
    return model.updateById(id, data);
  }).nodeify(callback);
};

Query.prototype.replace = function(data, cb){
  var callback = util.callbackWrapper(cb),
    model = this._model;

  return Promise.map(this.index, function(id){
    return model.replaceById(id, data);
  }).nodeify(cb);
};

Query.prototype.remove = function(cb){
  var callback = util.callbackWrapper(cb),
    model = this._model;

  return Promise.map(this.index, function(id){
    return model.removeById(id);
  }).nodeify(cb);
};

module.exports = Query;