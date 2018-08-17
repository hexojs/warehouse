'use strict';

const SchemaType = require('../schematype');
const util = require('../util');
const ValidationError = require('../error/validation');

/**
 * Boolean schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Boolean|Function} [options.default]
 * @extends {SchemaType}
 */
function SchemaTypeBoolean(name, options) {
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeBoolean, SchemaType);

/**
 * Casts a boolean.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeBoolean.prototype.cast = function(value_, data) {
  const value = SchemaType.prototype.cast.call(this, value_, data);

  if (value === 'false' || value === '0') return false;

  return Boolean(value);
};

/**
 * Validates a boolean.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Boolean|Error}
 */
SchemaTypeBoolean.prototype.validate = function(value_, data) {
  const value = SchemaType.prototype.validate.call(this, value_, data);

  if (value != null && typeof value !== 'boolean') {
    throw new ValidationError(`\`${value}\` is not a boolean!`);
  }

  return value;
};

/**
 * Parses data and transform them into boolean values.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeBoolean.prototype.parse = (value, data) => Boolean(value);

/**
 * Transforms data into number to compress the size of database files.
 *
 * @param {Boolean} value
 * @param {Object} data
 * @return {Number}
 */
SchemaTypeBoolean.prototype.value = (value, data) => +value;

module.exports = SchemaTypeBoolean;
