'use strict';

const cloneDeep = require('lodash/cloneDeep');

/**
 * Document constructor.
 *
 * @class
 * @param {object} data
 */
function Document(data) {
  if (data) {
    const keys = Object.keys(data);
    let key;

    for (let i = 0, len = keys.length; i < len; i++) {
      key = keys[i];
      this[key] = data[key];
    }
  }
}

/**
 * Saves the document.
 *
 * @param {function} [callback]
 * @return {Promise}
 */
Document.prototype.save = function(callback) {
  return this._model.save(this, callback);
};

/**
 * Updates the document.
 *
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Document.prototype.update = function(data, callback) {
  return this._model.updateById(this._id, data, callback);
};

/**
 * Replaces the document.
 *
 * @param {object} data
 * @param {function} [callback]
 * @return {Promise}
 */
Document.prototype.replace = function(data, callback) {
  return this._model.replaceById(this._id, data, callback);
};

/**
 * Removes the document.
 *
 * @param {function} [callback]
 * @return {Promise}
 */
Document.prototype.remove = function(callback) {
  return this._model.removeById(this._id, callback);
};

/**
 * Returns a plain JavaScript object.
 *
 * @return {object}
 */
Document.prototype.toObject = function() {
  const keys = Object.keys(this);
  const obj = {};
  let key;

  for (let i = 0, len = keys.length; i < len; i++) {
    key = keys[i];
    // Don't deep clone getters in order to avoid "Maximum call stack size
    // exceeded" error
    obj[key] = isGetter(this, key) ? this[key] : cloneDeep(this[key]);
  }

  return obj;
};

function isGetter(obj, key) {
  return Object.getOwnPropertyDescriptor(obj, key).get;
}

/**
 * Returns a string representing the document.
 *
 * @return {String}
 */
Document.prototype.toString = function() {
  return JSON.stringify(this);
};

/**
 * Populates document references.
 *
 * @param {String|Object} expr
 * @return {Document}
 */
Document.prototype.populate = function(expr) {
  const stack = this._schema._parsePopulate(expr);
  return this._model._populate(this, stack);
};

module.exports = Document;
