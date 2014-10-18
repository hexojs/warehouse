'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  cuid = require('cuid'),
  ValidationError = require('../error/validation');

function SchemaTypeCUID(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeCUID, SchemaType);

SchemaTypeCUID.prototype.cast = function(value, data){
  if (value == null){
    return cuid();
  } else {
    return value;
  }
};

SchemaTypeCUID.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (value.length !== 25) return new ValidationError('`' + value + '` is not a valid CUID');

  return value;
};

module.exports = SchemaTypeCUID;