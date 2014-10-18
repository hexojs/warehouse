'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  ValidationError = require('../error/validation');

function SchemaTypeBoolean(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeBoolean, SchemaType);

SchemaTypeBoolean.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value === 'false' || value === '0') return false;

  return Boolean(value);
};

SchemaTypeBoolean.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (typeof value !== 'boolean') return new ValidationError('`' + value + '` is not a boolean!');

  return value;
};

SchemaTypeBoolean.prototype.parse = function(value, data){
  return Boolean(value);
};

SchemaTypeBoolean.prototype.value = function(value, data){
  return +value;
};

module.exports = SchemaTypeBoolean;