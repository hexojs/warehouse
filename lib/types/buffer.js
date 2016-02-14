'use strict';

var SchemaType = require('../schematype');
var util = require('../util');
var _ = require('lodash');
var ValidationError = require('../error/validation');

var assign = _.assign;

/**
 * Boolean schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Boolean|Function} [options.default]
 *   @param {String} [options.encoding=hex]
 * @extends {SchemaType}
 */
function SchemaTypeBuffer(name, options) {
  SchemaType.call(this, name, assign({
    encoding: 'hex'
  }, options));
}

util.inherits(SchemaTypeBuffer, SchemaType);

/**
 * Casts data.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Buffer}
 */
SchemaTypeBuffer.prototype.cast = function(value_, data) {
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value == null || Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') return new Buffer(value, this.options.encoding);
  if (Array.isArray(value)) return new Buffer(value);
};

/**
 * Validates data.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Buffer}
 */
SchemaTypeBuffer.prototype.validate = function(value_, data) {
  var value = SchemaType.prototype.validate.call(this, value_, data);

  if (!Buffer.isBuffer(value)) {
    throw new ValidationError('`' + value + '` is not a valid buffer!');
  }

  return value;
};

/**
 * Compares between two buffers.
 *
 * @param {Buffer} a
 * @param {Buffer} b
 * @return {Number}
 */
SchemaTypeBuffer.prototype.compare = function(a, b) {
  if (Buffer.isBuffer(a)) {
    return Buffer.isBuffer(b) ? a.compare(b) : 1;
  }

  return Buffer.isBuffer(b) ? -1 : 0;
};

/**
 * Parses data and transform them into buffer values.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeBuffer.prototype.parse = function(value, data) {
  return value ? new Buffer(value, this.options.encoding) : value;
};

/**
 * Transforms data into number to compress the size of database files.
 *
 * @param {Buffer} value
 * @param {Object} data
 * @return {Number}
 */
SchemaTypeBuffer.prototype.value = function(value, data) {
  return Buffer.isBuffer(value) ? value.toString(this.options.encoding) : value;
};

/**
 * Checks the equality of data.
 *
 * @param {Buffer} value
 * @param {Buffer} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeBuffer.prototype.match = function(value, query, data) {
  if (Buffer.isBuffer(value) && Buffer.isBuffer(query)) {
    return value.equals(query);
  }

  return value === query;
};

module.exports = SchemaTypeBuffer;
