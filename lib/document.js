/**
* The document constructor.
*
* @class Document
* @param {Object} obj
* @constructor
* @module warehouse
*/

var Document = module.exports = function(obj){
  var keys = Object.keys(obj);

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i];
    this[key] = obj[key];
  }
};

/**
* Saves the document.
*
* @method save
* @param {Function} [callback]
* @chainable
*/

Document.prototype.save = function(callback){
  this._model.save(this, callback);
  return this;
};

/**
* Updates the document.
*
* @method update
* @param {Object} obj
* @param {Function} [callback]
* @chainable
*/

Document.prototype.update = function(obj, callback){
  this._model.updateById(this._id, obj, callback);
  return this;
};

/**
* Replaces the document.
*
* @method replace
* @param {Object} obj
* @param {Function} [callback]
* @chainable
*/

Document.prototype.replace = function(obj, callback){
  this._model.replaceById(this._id, obj, callback);
  return this;
};

/**
* Removes the document.
*
* @method remove
* @param {Function} [callback]
* @return {Document}
* @chainable
*/

Document.prototype.remove = function(callback){
  this._model.removeById(this._id, callback);
  return this;
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
* @param {String} name
* @return {Warehouse.Document}
*/

Document.prototype.populate = function(name){
  return this._model._populate(this, [name]);
};