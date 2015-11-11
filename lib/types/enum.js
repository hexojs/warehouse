'use strict';

var _ = require('lodash');
var SchemaType = require('../schematype');
var util = require('../util');
var ValidationError = require('../error/validation');

var extend = _.assign;
var contains = _.contains;

/**
 * Enum schema type.
 *
 * @class SchemaTypeEnum
 * @param {String} name
 * @param {Object} options
 *   @param {Boolean} [options.required=false]
 *   @param {Array} options.elements
 *   @param {*} [options.default]
 * @constructor
 * @extends {SchemaType}
 * @module warehouse
 */
function SchemaTypeEnum(name, options) {
  SchemaType.call(this, name, extend({
    elements: []
  }, options));
}

util.inherits(SchemaTypeEnum, SchemaType);

/**
 * Validates data. The value must be one of elements set in the options.
 *
 * @method validate
 * @param {*} value
 * @param {Object} data
 * @return {*}
 */
SchemaTypeEnum.prototype.validate = function(value_, data) {
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  var elements = this.options.elements;

  if (!contains(elements, value)) {
    return new ValidationError('The value must be one of ' + elements.join(', '));
  }

  return value;
};

module.exports = SchemaTypeEnum;
