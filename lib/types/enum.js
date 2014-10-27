'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  fast = require('fast.js'),
  ValidationError = require('../error/validation');

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
function SchemaTypeEnum(name, options){
  SchemaType.call(this, name, fast.assign({
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
SchemaTypeEnum.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  var elements = this.options.elements;

  if (util.contains(elements, value)){
    return new ValidationError('The value must be one of ' + elements.join(', '));
  }

  return value;
};

module.exports = SchemaTypeEnum;