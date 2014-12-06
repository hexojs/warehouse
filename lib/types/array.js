'use strict';

var SchemaType = require('../schematype');
var util = require('../util');
var _ = require('lodash');
var ValidationError = require('../error/validation');

var extend = util.extend;
var contains = util.contains;
var isArray = Array.isArray;

/**
 * Array schema type.
 *
 * @class SchemaTypeArray
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Array|Function} [options.default=[]]
 *   @param {SchemaType} [options.child]
 * @constructor
 * @extends {SchemaType}
 * @module warehouse
 */
function SchemaTypeArray(name, options){
  SchemaType.call(this, name, extend({
    default: []
  }, options));

  /**
   * Child schema type.
   *
   * @property {SchemaType} child
   */
  this.child = this.options.child || new SchemaType(name);
}

util.inherits(SchemaTypeArray, SchemaType);

/**
 * Casts an array and its child elements.
 *
 * @method cast
 * @param {*} value
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);
  if (value == null) return value;

  if (!isArray(value)) value = [value];
  if (!value.length) return value;

  var child = this.child;

  for (var i = 0, len = value.length; i < len; i++){
    value[i] = child.cast(value[i], data);
  }

  return value;
};

/**
 * Validates an array and its child elements.
 *
 * @method validate
 * @param {*} value
 * @param {Object} data
 * @return {Array|Error}
 */
SchemaTypeArray.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (!isArray(value)){
    return new ValidationError('`' + value + '` is not an array!');
  }

  if (!value.length) return value;

  var child = this.child;
  var result;

  for (var i = 0, len = value.length; i < len; i++){
    result = child.validate(value[i], data);

    if (result instanceof Error){
      return result;
    } else {
      value[i] = result;
    }
  }

  return value;
};

/**
 * Compares an array by its child elements and the size of the array.
 *
 * @method compare
 * @param {Array} a
 * @param {Array} b
 * @return {Number}
 */
SchemaTypeArray.prototype.compare = function(a, b){
  if (a){
    if (!b) return 1;
  } else {
    return b ? -1 : 0;
  }

  var lenA = a.length;
  var lenB = b.length;
  var child = this.child;
  var result;

  for (var i = 0, len = Math.min(lenA, lenB); i < len; i++){
    result = child.compare(a[i], b[i]);
    if (result !== 0) return result;
  }

  // Compare by length
  return lenA - lenB;
};

/**
 * Parses data.
 *
 * @method parse
 * @param {Array} value
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.parse = function(value, data){
  if (!value) return value;

  var len = value.length;
  if (!len) return [];

  var result = new Array(len);
  var child = this.child;

  for (var i = 0; i < len; i++){
    result[i] = child.parse(value[i], data);
  }

  return result;
};

/**
 * Transforms data.
 *
 * @method value
 * @param {Array} value
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.value = function(value, data){
  if (!value) return value;

  var len = value.length;
  if (!len) return [];

  var result = new Array(len);
  var child = this.child;

  for (var i = 0; i < len; i++){
    result[i] = child.value(value[i], data);
  }

  return result;
};

/**
 * Checks the equality of an array.
 *
 * @method match
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.match = function(value, query, data){
  if (!value) return false;

  var lenA = value.length;
  var lenB = query.length;

  if (lenA !== lenB) return false;

  var child = this.child;

  for (var i = 0; i < lenA; i++){
    if (!child.match(value[i], query[i], data)) return false;
  }

  return true;
};

/**
 * Checks whether the number of elements in an array is equal to `query`.
 *
 * @method q$size
 * @param {Array} value
 * @param {Number} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$size = function(value, query, data){
  return (value ? value.length : 0) === query;
};

/**
 * An alias for {% crosslink SchemaTypeArray.q$size %}.
 *
 * @method q$length
 */
SchemaTypeArray.prototype.q$length = SchemaTypeArray.prototype.q$size;

/**
 * Checks whether an array contains one of elements in `query`.
 *
 * @method q$in
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$in = function(value, query, data){
  if (!value) return false;

  for (var i = 0, len = query.length; i < len; i++){
    if (contains(value, query[i])) return true;
  }

  return false;
};

/**
 * Checks whether an array does not contain in any elements in `query`.
 *
 * @method q$nin
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$nin = function(value, query, data){
  if (!value) return true;

  for (var i = 0, len = query.length; i < len; i++){
    if (contains(value, query[i])) return false;
  }

  return true;
};

/**
 * Checks whether an array contains all elements in `query`.
 *
 * @method q$all
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$all = function(value, query, data){
  if (!value) return false;

  for (var i = 0, len = query.length; i < len; i++){
    if (!contains(value, query[i])) return false;
  }

  return true;
};

/**
 * Add elements to an array.
 *
 * @method u$push
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$push = function(value, update, data){
  if (isArray(update)){
    return value ? value.concat(update) : update;
  } else {
    if (value){
      value.push(update);
      return value;
    } else {
      return [update];
    }
  }
};

/**
 * An alias for {% crosslink SchemaTypeArray.u$push %}.
 *
 * @method u$append
 */
SchemaTypeArray.prototype.u$append = SchemaTypeArray.prototype.u$push;

/**
 * Add elements in front of an array.
 *
 * @method u$unshift
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$unshift = function(value, update, data){
  if (isArray(update)){
    return value ? update.concat(value) : update;
  } else {
    if (value){
      value.unshift(update);
      return value;
    } else {
      return [update];
    }
  }
};

/**
 * An alias for {% crosslink SchemaTypeArray.u$unshift %}.
 *
 * @method u$prepend
 */
SchemaTypeArray.prototype.u$prepend = SchemaTypeArray.prototype.u$unshift;

/**
 * Removes elements from an array.
 *
 * @method u$pull
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$pull = function(value, update, data){
  if (!value) return value;

  if (isArray(update)){
    return _.difference(value, update);
  } else {
    return _.without(value, update);
  }
};

/**
 * Removes the first element from an array.
 *
 * @method u$shift
 * @param {Array} value
 * @param {Number|Boolean} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$shift = function(value, update, data){
  if (!value || !update) return value;

  if (update === true){
    return value.slice(1);
  } else if (update > 0){
    return value.slice(update);
  } else {
    return value.slice(0, value.length + update);
  }
};

/**
 * Removes the last element from an array.
 *
 * @method u$pop
 * @param {Array} value
 * @param {Number|Boolean} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$pop = function(value, update, data){
  if (!value || !update) return value;

  var length = value.length;

  if (update === true){
    return value.slice(0, length - 1);
  } else if (update > 0){
    return value.slice(0, length - update);
  } else {
    return value.slice(-update, length);
  }
};

/**
 * Add elements to an array only if the value is not already in the array.
 *
 * @method u$addToSet
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$addToSet = function(value, update, data){
  if (isArray(update)){
    if (!value) return update;

    var item;

    for (var i = 0, len = update.length; i < len; i++){
      item = update[i];
      if (!contains(value, item)) value.push(item);
    }

    return value;
  } else {
    if (!value) return [update];

    if (!contains(value, update)){
      value.push(update);
    }

    return value;
  }
};

module.exports = SchemaTypeArray;