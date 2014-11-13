'use strict';

var SchemaType = require('../schematype');
var util = require('../util');
var ValidationError = require('../error/validation');

/**
 * Date schema type.
 *
 * @class SchemaTypeDate
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Date|Number|Function} [options.default]
 * @constructor
 * @extends {SchemaType}
 * @module warehouse
 */
function SchemaTypeDate(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeDate, SchemaType);

/**
 * Casts data.
 *
 * @method cast
 * @param {*} value
 * @param {Object} data
 * @return {Date}
 */
SchemaTypeDate.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value == null || util.isDate(value)) return value;

  return new Date(value);
};

/**
 * Validates data.
 *
 * @method validate
 * @param {*} value
 * @param {Object} data
 * @return {Date|Error}
 */
SchemaTypeDate.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (value != null && (!util.isDate(value) || isNaN(value.getTime())) ){
    return new ValidationError('`' + value + '` is not a valid date!');
  }

  return value;
};

/**
 * Checks the equality of data.
 *
 * @method match
 * @param {Date} value
 * @param {Date} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeDate.prototype.match = function(value, query, data){
  return value ? value.getTime() === query.getTime() : false;
};

/**
 * Compares between two dates.
 *
 * @method compare
 * @param {Date} a
 * @param {Date} b
 * @return {Number}
 */
SchemaTypeDate.prototype.compare = function(a, b){
  if (a){
    if (b){ // a && b
      return a - b;
    } else { // a && !b
      return 1;
    }
  } else {
    if (b){ // !a && b
      return -1;
    } else { // !a && !b
      return 0;
    }
  }
};

/**
 * Parses data and transforms it into a date object.
 *
 * @method parse
 * @param {*} value
 * @param {Object} data
 * @return {Date}
 */
SchemaTypeDate.prototype.parse = function(value, data){
  if (value) return new Date(value);
};

/**
 * Transforms a date object to a string.
 *
 * @method value
 * @param {Date} value
 * @param {Object} data
 * @return {String}
 */
SchemaTypeDate.prototype.value = function(value, data){
  return value ? value.toISOString() : value;
};

/**
 * Finds data by its date.
 *
 * @method q$day
 * @param {Date} value
 * @param {Number} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeDate.prototype.q$day = function(value, query, data){
  return value ? value.getDate() === query : false;
};

/**
 * Finds data by its month. (Start from 0)
 *
 * @method q$month
 * @param {Date} value
 * @param {Number} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeDate.prototype.q$month = function(value, query, data){
  return value ? value.getMonth() === query : false;
};

/**
 * Finds data by its year. (4-digit)
 *
 * @method q$year
 * @param {Date} value
 * @param {Number} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeDate.prototype.q$year = function(value, query, data){
  return value ? value.getFullYear() === query : false;
};

/**
 * Adds milliseconds to date.
 *
 * @method u$inc
 * @param {Date} value
 * @param {Number} update
 * @param {Object} data
 * @return {Date}
 */
SchemaTypeDate.prototype.u$inc = function(value, update, data){
  if (value) return new Date(value.getTime() + update);
};

/**
 * Subtracts milliseconds from date.
 *
 * @method u$dec
 * @param {Date} value
 * @param {Number} update
 * @param {Object} data
 * @return {Date}
 */
SchemaTypeDate.prototype.u$dec = function(value, update, data){
  if (value) return new Date(value.getTime() - update);
};

module.exports = SchemaTypeDate;