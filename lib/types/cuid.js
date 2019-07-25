'use strict';

const SchemaType = require('../schematype');
const util = require('../util');
const cuid = require('cuid');
const ValidationError = require('../error/validation');

/**
 * [CUID](https://github.com/ericelliott/cuid) schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 * @extends {SchemaType}
 */
class SchemaTypeCUID {
  constructor(name, options) {
    SchemaType.call(this, name, options);
  }

  /**
   * Casts data. Returns a new CUID only if value is null and the field is
   * required.
   *
   * @param {String} value
   * @param {Object} data
   * @return {String}
   */
  cast(value, data) {
    if (value == null && this.options.required) {
      return cuid();
    }

    return value;
  }

  /**
   * Validates data. A valid CUID must be started with `c` and 25 in length.
   *
   * @param {*} value
   * @param {Object} data
   * @return {String|Error}
   */
  validate(value, data) {
    if (value && (value[0] !== 'c' || value.length !== 25)) {
      throw new ValidationError(`\`${value}\` is not a valid CUID`);
    }

    return value;
  }
}

util.inherits(SchemaTypeCUID, SchemaType);

module.exports = SchemaTypeCUID;
