'use strict';

const SchemaType = require('../schematype');
const util = require('../util');
const ValidationError = require('../error/validation');

/**
 * Enum schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} options
 *   @param {Boolean} [options.required=false]
 *   @param {Array} options.elements
 *   @param {*} [options.default]
 * @extends {SchemaType}
 */
function SchemaTypeEnum(name, options) {
  SchemaType.call(this, name, Object.assign({
    elements: []
  }, options));
}

util.inherits(SchemaTypeEnum, SchemaType);

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
