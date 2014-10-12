'use strict';

var util = require('./util'),
  _ = require('lodash');

function Document(data){
  var keys = Object.keys(data),
    key;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    this[key] = data[key];
  }
}

Document.prototype.save = function(callback){
  return this._model.save(this, callback);
};

Document.prototype.update = function(data, callback){
  return this._model.updateById(this._id, data, callback);
};

Document.prototype.replace = function(data, callback){
  return this._model.replaceById(this._id, data, callback);
};

Document.prototype.remove = function(callback){
  return this._model.removeById(this._id, callback);
};

Document.prototype.toObject = function(){
  return _.cloneDeep(this);
};

Document.prototype.toString = function(){
  return JSON.stringify(this);
};

module.exports = Document;