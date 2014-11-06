'use strict';

var _ = require('lodash');

/**
 * Document constructor.
 *
 * @class Document
 * @param {Object} data
 * @constructor
 * @module warehouse
 */
function Document(data){
  if (data){
    var keys = Object.keys(data),
      key;

    for (var i = 0, len = keys.length; i < len; i++) {
      key = keys[i];
      this[key] = data[key];
    }
  }
}

/**
 * Saves the document.
 *
 * @method save
 * @param {Function} [callback]
 * @return {Promise}
 */
Document.prototype.save = function(callback){
  return this._model.save(this, callback);
};

/**
 * Updates the document.
 *
 * @method update
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Document.prototype.update = function(data, callback){
  return this._model.updateById(this._id, data, callback);
};

/**
 * Replaces the document.
 *
 * @method replace
 * @param {Object} data
 * @param {Function} [callback]
 * @return {Promise}
 */
Document.prototype.replace = function(data, callback){
  return this._model.replaceById(this._id, data, callback);
};

/**
 * Removes the document.
 *
 * @method remove
 * @param {Function} [callback]
 * @return {Promise}
 */
Document.prototype.remove = function(callback){
  return this._model.removeById(this._id, callback);
};

/**
 * Returns a plain JavaScript object.
 *
 * @method toObject
 * @return {Object}
 */
Document.prototype.toObject = function(){
  var keys = Object.keys(this),
    obj = {},
    key;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    obj[key] = _.cloneDeep(this[key]);
  }

  return obj;
};

/**
 * Returns a string representing the document.
 *
 * @method toString
 * @return {String}
 */
Document.prototype.toString = function(){
  return JSON.stringify(this);
};

/**
 * Populates document references.
 *
 * @method populate
 * @param {String|Object} expr
 * @return {Document}
 */
Document.prototype.populate = function(expr){
  var stack = this._schema._parsePopulate(expr);
  return this._model._populate(this, stack);
};

module.exports = Document;
