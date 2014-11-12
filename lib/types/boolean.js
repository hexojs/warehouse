'use strict';

var SchemaType = require('../schematype');
var util = require('../util');
var ValidationError = require('../error/validation');

/**
 * Boolean schema type.
 *
 * @class SchemaTypeBoolean
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Boolean|Function} [options.default]
 * @constructor
 * @extends {SchemaType}
 * @module warehouse
 */
function SchemaTypeBoolean(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeBoolean, SchemaType);

/**
 * Casts a boolean.
 *
 * @method cast
 * @param {*} value
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeBoolean.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value === 'false' || value === '0') return false;

  return Boolean(value);
};

/**
 * Validates a boolean.
 *
 * @method validate
 * @param {*} value
 * @param {Object} data
 * @return {Boolean|Error}
 */
SchemaTypeBoolean.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (value != null && typeof value !== 'boolean'){
    return new ValidationError('`' + value + '` is not a boolean!');
  }

  return value;
};

/**
 * Parses data and transform them into boolean values.
 *
 * @method parse
 * @param {*} value
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeBoolean.prototype.parse = function(value, data){
  return Boolean(value);
};

/**
 * Transforms data into number to compress the size of database files.
 *
 * @method value
 * @param {Boolean} value
 * @param {Object} data
 * @return {Number}
 */
SchemaTypeBoolean.prototype.value = function(value, data){
  return +value;
};

module.exports = SchemaTypeBoolean;