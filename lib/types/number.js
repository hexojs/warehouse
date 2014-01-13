var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
* Schema type: Number
*
* @class Number
* @param {Object} [options]
* @constructor
* @extends SchemaType
* @namespace SchemaType
* @module warehouse
*/

var SchemaNumber = module.exports = function(options){
  SchemaType.call(this, options);
};

/**
* @property type
* @type Number
* @static
*/

SchemaNumber.type = SchemaNumber.prototype.type = Number;

SchemaNumber.__proto__ = SchemaType;
SchemaNumber.prototype.__proto__ = SchemaType.prototype;

/**
* Checks if the given `value` is a number.
*
* @method checkRequired
* @param {Any} value
* @return {Boolean}
*/

SchemaNumber.prototype.checkRequired = function(value){
  return value instanceof Number || typeof value === 'number';
};

/**
* Casts the given `value` to a number.
*
* @method cast
* @param {Any} value
* @return {Number}
*/

SchemaNumber.prototype.cast = function(value){
  if (value == null) return value;
  if (value === '') return null;
  if (value instanceof Number || typeof value === 'number') return value;
  if (!isNaN(+value)) return +value;

  return null;
};

/**
* Adds `value` to `data`.
*
* @method u$inc
* @param {Number} data
* @param {Number} value
* @return {Number}
*/

SchemaNumber.prototype.u$inc = function(data, value){
  if (!data) return +value;

  return data + +value;
};

/**
* Substracts `value` from `data`.
*
* @method u$dec
* @param {Number} data
* @param {Number} value
* @return {Number}
*/

SchemaNumber.prototype.u$dec = function(data, value){
  if (!data) return -+value;

  return data - +value;
};