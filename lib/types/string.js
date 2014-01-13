var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
* Schema type: String.
*
* @class String
* @param {Object} [options]
* @constructor
* @extends SchemaType
* @namespace SchemaType
* @module warehouse
*/

var SchemaString = module.exports = function(options){
  SchemaType.call(this, options);

  /**
  * @property ref
  * @type String
  */

  if (options && options.ref) this.ref = options.ref;
};

/**
* @property type
* @type String
* @static
*/

SchemaString.type = SchemaString.prototype.type = String;

SchemaString.__proto__ = SchemaType;
SchemaString.prototype.__proto__ = SchemaType.prototype;

/**
* Checks if the given `value` is a string.
*
* @method checkRequired
* @param {Any} value
* @return {Boolean}
*/

SchemaString.prototype.checkRequired = function(value){
  return value instanceof String || typeof value === 'string';
};

/**
* Casts the given `value` to a string.
*
* @method cast
* @param {Any} value
* @return {String}
*/

SchemaString.prototype.cast = function(value){
  if (value == null) return value;
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
* @method compare
* @param {String} data
* @param {String} value
* @return {Boolean}
*/

var compare = SchemaString.prototype.compare = function(data, value){
  if (value instanceof RegExp){
    return value.test(data);
  } else {
    return data == value;
  }
};