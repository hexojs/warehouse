/**
 * Module dependencies.
 */

var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
 * Creates a new SchemaDate instance.
 *
 * @param {Object} [options]
 * @api public
 */

var SchemaDate = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaDate.type = SchemaDate.prototype.type = Date;

/**
 * Inherits from SchemaType.
 */

SchemaDate.prototype.__proto__ = SchemaType.prototype;

/**
 * Checks if the given `value` is a date object.
 *
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaDate.prototype.checkRequired = function(value){
  return value instanceof Date;
};

/**
 * Casts the given `value` to a date object.
 *
 * @param {any} value
 * @return {Date}
 * @api public
 */

var cast = SchemaDate.prototype.cast = function(value){
  if (value === null || value === '') return null;
  if (value instanceof Date) return value;

  if (value instanceof Number || typeof value === 'number'){
    return new Date(value);
  }

  if (!isNaN(+value)){
    return new Date(+value);
  }

  var date = new Date(value);

  if (date.toString() !== 'Invalid Date'){
    return date;
  } else {
    return null;
  }
};

/**
 * Transforms a date object into a number.
 *
 * @param {Date} value
 * @return {Number}
 * @api public
 */

SchemaDate.prototype.save = function(value){
  return value.valueOf();
};

/**
 * Compares data.
 *
 * @param {Date} data
 * @param {Date} value
 * @return {Boolean}
 * @api public
 */

SchemaDate.compare = function(data, value){
  return data.valueOf() === cast(value).valueOf();
};

/**
 * Inherits query operators from SchemaType.
 */

var queryOperators = SchemaDate.queryOperators = _.clone(SchemaType.queryOperators);

queryOperators.year = function(data, value){
  return data ? data.getFullYear() == value : false;
};

queryOperators.month = function(data, value){
  return data ? data.getMonth() == value - 1 : false;
};

queryOperators.day = function(data, value){
  return data ? data.getDate() == value : false;
};

queryOperators.ne = function(data, value){
  return data == null ? false : data.valueOf() !== cast(value).valueOf();
};

/**
 * Inherits update operators from SchemaType.
 */

var updateOperators = SchemaDate.updateOperators = _.clone(SchemaType.updateOperators);

updateOperators.inc = function(data, value){
  if (!data) return;

  return new Date(data.valueOf() + +value);
};

updateOperators.dec = function(data, value){
  if (!data) return;

  return new Date(data.valueOf() - +value);
};