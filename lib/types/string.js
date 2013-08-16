/**
 * Module dependencies.
 */

var _ = require('lodash'),
  SchemaType = require('../schematype');


/**
 * Creates a new SchemaString instance.
 *
 * @param {Object} [options]
 * @api public
 */

var SchemaString = module.exports = function(options){
  SchemaType.call(this, options);

  if (options && options.ref) this.ref = options.ref;
};

SchemaString.type = SchemaString.prototype.type = String;

/**
 * Inherits from SchemaType.
 */

SchemaString.__proto__ = SchemaType;
SchemaString.prototype.__proto__ = SchemaType.prototype;

/**
 * Checks if the given `value` is a string.
 *
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaString.prototype.checkRequired = function(value){
  return value instanceof String || typeof value === 'string';
};

/**
 * Casts the given `value` to a string.
 *
 * @param {any} value
 * @return {String}
 * @api public
 */

SchemaString.prototype.cast = function(value){
  if (value === null) return value;
  if (value instanceof String || typeof value === 'string') return value;

  if (value.toString){
    return value.toString();
  } else {
    return null;
  }
};

/**
 * Compares data.
 *
 * @param {String} data
 * @param {String} value
 * @return {Boolean}
 * @api public
 */

var compare = SchemaString.prototype.compare = function(data, value){
  if (value instanceof RegExp){
    return value.test(data);
  } else {
    return data == value;
  }
};