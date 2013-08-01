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
  if (value === null) return value;
  if (value === '') return null;
  if (value instanceof Number || typeof value === 'number') return value;
  if (!isNaN(+value)) return +value;

  return null;
};

/**
 * Inherits compare function from SchemaType.
 */

SchemaNumber.compare = SchemaType.compare;

/**
 * Inherits query operators from SchemaType.
 */

SchemaNumber.queryOperators = _.clone(SchemaType.queryOperators);

/**
 * Inherits query operators from SchemaType.
 */

var updateOperators = SchemaNumber.updateOperators = _.clone(SchemaType.updateOperators);

updateOperators.inc = function(data, value){
  if (!data) return +value;

  return data + +value;
};

updateOperators.dec = function(data, value){
  if (!data) return -+value;

  return data - +value;
};