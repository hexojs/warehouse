'use strict';

const SchemaType = require('../schematype');
const ValidationError = require('../error/validation');

/**
 * Enum schema type.
 */
class SchemaTypeEnum extends SchemaType {

  /**
   *
   * @param {string} name
   * @param {object} options
   *   @param {Boolean} [options.required=false]
   *   @param {Array} options.elements
   *   @param {*} [options.default]
   */
  constructor(name, options) {
    super(name, Object.assign({
      elements: []
    }, options));
  }
}

/**
 * Validates data. The value must be one of elements set in the options.
 *
 * @param {*} value
 * @param {Object} data
 * @return {*}
 */
SchemaTypeEnum.prototype.validate = function(value_, data) {
  const value = SchemaType.prototype.validate.call(this, value_, data);
  const elements = this.options.elements;

  if (!elements.includes(value)) {
    throw new ValidationError(`The value must be one of ${elements.join(', ')}`);
  }

  return value;
};

module.exports = SchemaTypeEnum;
