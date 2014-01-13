var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
* Schema type: Date.
*
* @class Date
* @param {Object} [options]
* @constructor
* @extends SchemaType
* @namespace SchemaType
* @module warehouse
*/

var SchemaDate = module.exports = function(options){
  SchemaType.call(this, options);
};

/**
* @property type
* @type Date
* @static
*/

SchemaDate.type = SchemaDate.prototype.type = Date;

SchemaDate.__proto__ = SchemaType;
SchemaDate.prototype.__proto__ = SchemaType.prototype;

/**
* Checks if the given `value` is a date object.
*
* @method checkRequired
* @param {Any} value
* @return {Boolean}
*/

SchemaDate.prototype.checkRequired = function(value){
  return value instanceof Date;
};

/**
* Casts the given `value` to a date object.
*
* @method cast
* @param {Any} value
* @return {Date}
*/

var cast = SchemaDate.prototype.cast = function(value){
  if (value == null || value === '') return null;
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
* @method save
* @param {Date} value
* @return {Number}
*/

SchemaDate.prototype.save = function(value){
  return value.valueOf();
};

/**
* Compares data.
*
* @method compare
* @param {Date} data
* @param {Date} value
* @return {Boolean}
*/

SchemaDate.prototype.compare = function(data, value){
  return data.valueOf() === cast(value).valueOf();
};

/**
* Checks whether `data` is in the specific year.
*
* @method q$year
* @param {Date} data
* @param {Number} value
* @return {Boolean}
*/

SchemaDate.prototype.q$year = function(data, value){
  return data ? data.getFullYear() == value : false;
};

/**
* Checks whether `data` is in the specific month.
*
* @method q$month
* @param {Date} data
* @param {Number} value
* @return {Boolean}
*/

SchemaDate.prototype.q$month = function(data, value){
  return data ? data.getMonth() == value - 1 : false;
};

/**
* Checks whether `data` is at the specific day.
*
* @method q$day
* @param {Date} data
* @param {Number} value
* @return {Boolean}
*/

SchemaDate.prototype.q$day = function(data, value){
  return data ? data.getDate() == value : false;
};

/**
* Adds `value` to `data`.
*
* @method u$inc
* @param {Date} data
* @param {Number} value
* @return {Date}
*/

SchemaDate.prototype.u$inc = function(data, value){
  if (!data) return;

  return new Date(data.valueOf() + +value);
};

/**
* Substracts `value` from `data`.
*
* @method u$dec
* @param {Date} data
* @param {Number} value
* @return {Date}
*/

SchemaDate.prototype.u$dec = function(data, value){
  if (!data) return;

  return new Date(data.valueOf() - +value);
};