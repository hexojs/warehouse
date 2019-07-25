'use strict';

const SchemaType = require('../schematype');
const ValidationError = require('../error/validation');

/**
 * Boolean schema type.
 */
class SchemaTypeBuffer extends SchemaType {

  /**
   * @param {string} name
   * @param {object} [options]
   *   @param {boolean} [options.required=false]
   *   @param {boolean|Function} [options.default]
   *   @param {string} [options.encoding=hex]
   */
  constructor(name, options) {
    super(name, Object.assign({
      encoding: 'hex'
    }, options));
  }

  /**
   * Casts data.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Buffer}
   */
  cast(value_, data) {
    const value = super.cast(value_, data);

    if (value == null || Buffer.isBuffer(value)) return value;
    if (typeof value === 'string') return new Buffer(value, this.options.encoding);
    if (Array.isArray(value)) return new Buffer(value);
  }

  /**
   * Validates data.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Buffer}
   */
  validate(value_, data) {
    const value = super.validate(value_, data);

    if (!Buffer.isBuffer(value)) {
      throw new ValidationError(`\`${value}\` is not a valid buffer!`);
    }

    return value;
  }

  /**
   * Compares between two buffers.
   *
   * @param {Buffer} a
   * @param {Buffer} b
   * @return {Number}
   */
  compare(a, b) {
    if (Buffer.isBuffer(a)) {
      return Buffer.isBuffer(b) ? bufferCompare(a, b) : 1;
    }

    return Buffer.isBuffer(b) ? -1 : 0;
  }

  /**
   * Parses data and transform them into buffer values.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Boolean}
   */
  parse(value, data) {
    return value ? new Buffer(value, this.options.encoding) : value;
  }

  /**
   * Transforms data into number to compress the size of database files.
   *
   * @param {Buffer} value
   * @param {Object} data
   * @return {Number}
   */
  value(value, data) {
    return Buffer.isBuffer(value) ? value.toString(this.options.encoding) : value;
  }

  /**
   * Checks the equality of data.
   *
   * @param {Buffer} value
   * @param {Buffer} query
   * @param {Object} data
   * @return {Boolean}
   */
  match(value, query, data) {
    if (Buffer.isBuffer(value) && Buffer.isBuffer(query)) {
      return bufferEqual(value, query);
    }

    return value === query;
  }
}

function bufferCompare(a, b) {
  if (typeof a.compare === 'function') return a.compare(b);

  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  }

  return 0;
}

function bufferEqual(a, b) {
  if (typeof a.equals === 'function') return a.equals(b);
  if (a.length !== b.length) return false;

  for (let i = 0, len = a.length; i < len; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

module.exports = SchemaTypeBuffer;
