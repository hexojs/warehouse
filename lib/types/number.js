'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  ValidationError = require('../error/validation');

function SchemaTypeNumber(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeNumber, SchemaType);

SchemaTypeNumber.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value == null) return value;
  if (typeof value === 'number') return value;

  return +value;
};

SchemaTypeNumber.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (typeof value !== 'number' || isNaN(value)){
    return new ValidationError('`' + value + '` is not a number!');
  }

  return value;
};

SchemaTypeNumber.prototype.u$inc = function(value, update, data){
  return value + update;
};

SchemaTypeNumber.prototype.u$add = SchemaTypeNumber.prototype.u$inc;

SchemaTypeNumber.prototype.u$dec = function(value, update, data){
  return value - update;
};

SchemaTypeNumber.prototype.u$sub = SchemaTypeNumber.prototype.u$dec;

SchemaTypeNumber.prototype.u$subtract = SchemaTypeNumber.prototype.u$dec;

SchemaTypeNumber.prototype.u$mul = function(value, update, data){
  return value * update;
};

SchemaTypeNumber.prototype.u$multiply = SchemaTypeNumber.prototype.u$mul;

SchemaTypeNumber.prototype.u$div = function(value, update, data){
  return value / update;
};

SchemaTypeNumber.prototype.u$divide = SchemaTypeNumber.prototype.u$div;

SchemaTypeNumber.prototype.u$mod = function(value, update, data){
  return value % update;
};

SchemaTypeNumber.prototype.u$max = function(value, update, data){
  return update > value ? update : value;
};

SchemaTypeNumber.prototype.u$min = function(value, update, data){
  return update < value ? update : value;
};

module.exports = SchemaTypeNumber;