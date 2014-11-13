'use strict';

var SchemaTypeNumber = require('./number');
var util = require('../util');
var ValidationError = require('../error/validation');

/**
 * Integer schema type.
 *
 * @method SchemaTypeInteger
 * @param {String} name
 * @param {Object} options
 *   @param {Boolean} [options.required=false]
 *   @param {Number|Function} [options.default]
 * @constructor
 * @extends {SchemaTypeNumber}
 * @module warehouse
 */
function SchemaTypeInteger(name, options){
  SchemaTypeNumber.call(this, name, options);
}

util.inherits(SchemaTypeInteger, SchemaTypeNumber);

/**
 * Casts a integer.
 *
 * @method cast
 * @param {*} value
 * @param {Object} data
 * @return {Number}
 */
SchemaTypeInteger.prototype.cast = function(value_, data){
  var value = SchemaTypeNumber.prototype.cast.call(this, value_, data);

  return parseInt(value, 10);
};

/**
 * Validates an integer.
 *
 * @method validate
 * @param {*} value
 * @param {Object} data
 * @return {Number|Error}
 */
SchemaTypeInteger.prototype.validate = function(value_, data){
  var value = SchemaTypeNumber.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (value % 1 !== 0){
    return new ValidationError('`' + value + '` is not an integer!');
  }

  return value;
};

module.exports = SchemaTypeInteger;