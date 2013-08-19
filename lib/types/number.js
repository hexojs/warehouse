/**
 * Module dependencies.
 */

var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
 * Creates a new SchemaNumber instance.
 *
 * @param {Object} [options]
 * @api public
 */

var SchemaNumber = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaNumber.__proto__ = SchemaType;
SchemaNumber.type = SchemaNumber.prototype.type = Number;

/**
 * Inherits from SchemaType.
 */

SchemaNumber.prototype.__proto__ = SchemaType.prototype;

/**
 * Checks if the given `value` is a number.
 *
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaNumber.prototype.checkRequired = function(value){
  return value instanceof Number || typeof value === 'number';
};

/**
 * Casts the given `value` to a number.
 *
 * @param {any} value
 * @return {Number}
 * @api public
 */

SchemaNumber.prototype.cast = function(value){
  if (value == null) return value;
  if (value === '') return null;
  if (value instanceof Number || typeof value === 'number') return value;
  if (!isNaN(+value)) return +value;

  return null;
};

SchemaNumber.prototype.u$inc = function(data, value){
  if (!data) return +value;

  return data + +value;
};

SchemaNumber.prototype.u$dec = function(data, value){
  if (!data) return -+value;

  return data - +value;
};