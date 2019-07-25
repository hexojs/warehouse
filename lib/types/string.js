'use strict';

const SchemaType = require('../schematype');
const ValidationError = require('../error/validation');

/**
 * String schema type.
 */
class SchemaTypeString extends SchemaType {}

/**
 * Casts a string.
 *
 * @param {*} value
 * @param {Object} data
 * @return {String}
 */
SchemaTypeString.prototype.cast = function(value_, data) {
  const value = SchemaType.prototype.cast.call(this, value_, data);

  if (value == null || typeof value === 'string') return value;
  if (typeof value.toString === 'function') return value.toString();
};

/**
 * Validates a string.
 *
 * @param {*} value
 * @param {Object} data
 * @return {String|Error}
 */
SchemaTypeString.prototype.validate = function(value_, data) {
  const value = SchemaType.prototype.validate.call(this, value_, data);

  if (value !== undefined && typeof value !== 'string') {
    throw new ValidationError(`\`${value}\` is not a string!`);
  }

  return value;
};

/**
 * Checks the equality of data.
 *
 * @param {*} value
 * @param {String|RegExp} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeString.prototype.match = (value, query, data) => {
  if (!value || !query) {
    return value === query;
  }

  if (typeof query.test === 'function') {
    return query.test(value);
  }

  return value === query;
};

/**
 * Checks whether a string is equal to one of elements in `query`.
 *
 * @param {String} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeString.prototype.q$in = function(value, query, data) {
  for (let i = 0, len = query.length; i < len; i++) {
    if (this.match(value, query[i], data)) return true;
  }

  return false;
};

/**
 * Checks whether a string is not equal to any elements in `query`.
 *
 * @param {String} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeString.prototype.q$nin = function(value, query, data) {
  return !this.q$in(value, query, data);
};

/**
 * Checks length of a string.
 *
 * @param {String} value
 * @param {Number} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeString.prototype.q$length = (value, query, data) => (value ? value.length : 0) === query;

module.exports = SchemaTypeString;
