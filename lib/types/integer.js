'use strict';

const SchemaTypeNumber = require('./number');
const util = require('../util');
const ValidationError = require('../error/validation');

/**
 * Integer schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} options
 *   @param {Boolean} [options.required=false]
 *   @param {Number|Function} [options.default]
 * @extends {SchemaTypeNumber}
 */
class SchemaTypeInteger {
  constructor(name, options) {
    SchemaTypeNumber.call(this, name, options);
  }

  /**
   * Casts a integer.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number}
   */
  cast(value_, data) {
    const value = SchemaTypeNumber.prototype.cast.call(this, value_, data);

    return parseInt(value, 10);
  }

  /**
   * Validates an integer.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number|Error}
   */
  validate(value_, data) {
    const value = SchemaTypeNumber.prototype.validate.call(this, value_, data);

    if (value % 1 !== 0) {
      throw new ValidationError(`\`${value}\` is not an integer!`);
    }

    return value;
  }
}

util.inherits(SchemaTypeInteger, SchemaTypeNumber);

module.exports = SchemaTypeInteger;
