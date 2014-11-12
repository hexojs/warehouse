'use strict';

var SchemaType = require('../schematype');
var util = require('../util');
var cuid = require('cuid');
var ValidationError = require('../error/validation');

/**
 * [CUID](https://github.com/ericelliott/cuid) schema type.
 *
 * @class SchemaTypeCUID
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 * @constructor
 * @extends {SchemaType}
 * @module warehouse
 */
function SchemaTypeCUID(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeCUID, SchemaType);

/**
 * Casts data. Returns a new CUID only if value is null and the field is
 * required.
 *
 * @method cast
 * @param {String} value
 * @param {Object} data
 * @return {String}
 */
SchemaTypeCUID.prototype.cast = function(value, data){
  if (value == null && this.options.required){
    return cuid();
  } else {
    return value;
  }
};

/**
 * Validates data. A valid CUID must be started with `c` and 25 in length.
 *
 * @method validate
 * @param {*} value
 * @param {Object} data
 * @return {String|Error}
 */
SchemaTypeCUID.prototype.validate = function(value, data){
  if (value && (value[0] !== 'c' || value.length !== 25)){
    return new ValidationError('`' + value + '` is not a valid CUID');
  }

  return value;
};

module.exports = SchemaTypeCUID;