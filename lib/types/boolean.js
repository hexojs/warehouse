var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
* Schema type: Boolean
*
* @class Boolean
* @param {Object} [options]
* @constructor
* @extends SchemaType
* @namespace SchemaType
* @module warehouse
*/

var SchemaBoolean = module.exports = function(options){
  SchemaType.call(this, options);
};

/**
* @property type
* @type Boolean
* @static
*/

SchemaBoolean.type = SchemaBoolean.prototype.type = Boolean;

SchemaBoolean.__proto__ = SchemaType;
SchemaBoolean.prototype.__proto__ = SchemaType.prototype;

/**
* Checks if the given `value` is a boolean.
*
* @method checkRequired
* @param {Any} value
* @return {Boolean}
*/

SchemaBoolean.prototype.checkRequired = function(value){
  return value === true || value === false;
};

/**
* Casts the given `value` to a boolean.
*
* @method cast
* @param {Any} value
* @return {Boolean}
*/

SchemaBoolean.prototype.cast = function(value){
  if (value == null) return value;
  if ('0' === value) return false;
  if ('true' === value) return true;
  if ('false' === value) return false;

  return !!value;
};