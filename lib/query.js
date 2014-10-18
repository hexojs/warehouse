'use strict';

var fast = require('fast.js'),
  _ = require('lodash');

function Query(index){
  this.index = index;
  this.length = index.length;
}

Query.prototype._createQuery = function(index){
  return new this._model.Query(index);
};

Query.prototype.count = function(){
  return this.length;
};

Query.prototype.eq = function(i, options){
  //
};

Query.prototype.first = function(options){
  return this.eq(0, options);
};

Query.prototype.last = function(options){
  return this.eq(-1, options);
};

Query.prototype.reverse = function(){
  return this._createQuery(fast.cloneArray(this.index).reverse());
};

Query.prototype.find = function(query, options_){
  // var options = options_ || {},
  //   filter = this._schema._execSearch(query),
  //   keys = this.index,
  //   data = this._model.data,
  //   arr = [],
  //   key;

  // for (var i = 0, len = keys.length; i < len; i++){
  //   key = keys[i];

  //   if (filter(data[key])){
  //     arr.push(key);
  //   }
  // }

  // return this._createQuery(arr);
};

Query.prototype.findOne = function(query, options){
  return this.find(query, fast.assign({
    limit: 1
  }, options)).first();
};

module.exports = Query;