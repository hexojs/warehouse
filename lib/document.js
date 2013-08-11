/**
 * Creates a new instance of document.
 *
 * @param {Object} obj
 * @public api
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
 * @param {Function} [callback]
 * @return {Document}
 * @api public
 */

Document.prototype.save = function(callback){
  this._model.save(this, callback);
  return this;
};

/**
 * Updates the document.
 *
 * @param {Object} obj
 * @param {Function} [callback]
 * @api public
 */

Document.prototype.update = function(obj, callback){
  this._model.updateById(this._id, obj, callback);
  return this;
};

/**
 * Replaces the document.
 *
 * @param {Object} obj
 * @param {Function} [callback]
 * @api public
 */

Document.prototype.replace = function(obj, callback){
  this._model.replaceById(this._id, obj, callback);
  return this;
};

/**
 * Removes the document.
 *
 * @param {Function} [callback]
 * @return {Document}
 * @api public
 */

Document.prototype.remove = function(callback){
  this._model.removeById(this._id, callback);
  return this;
};

/**
 * Returns a string representing the document.
 *
 * @return {String}
 * @api public
 */

Document.prototype.toString = function(){
  return JSON.stringify(this);
};

/**
 * Populates document references.
 *
 * @return {Document}
 * @api public
 */

Document.prototype.populate = function(name){
  return this._model._populate(this, [name]);
};