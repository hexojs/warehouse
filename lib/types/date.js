'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  _ = require('lodash'),
  ValidationError = require('../error/validation');

function SchemaTypeDate(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeDate, SchemaType);

SchemaTypeDate.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value == null) return value;
  if (_.isDate(value)) return value;

  return new Date(value);
};

SchemaTypeDate.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (!_.isDate(value) || isNaN(value.getTime())){
    return new ValidationError('`' + value + '` is not a valid date!');
  }

  return value;
};

SchemaTypeDate.prototype.compare = function(a, b){
  var timeA = a.getTime(),
    timeB = b.getTime();

  if (timeA > timeB){
    return 1;
  } else if (timeA < timeB){
    return -1;
  } else {
    return 0;
  }
};

SchemaTypeDate.prototype.parse = function(value, data){
  return new Date(value);
};

SchemaTypeDate.prototype.value = function(value, data){
  return value.toISOString();
};

module.exports = SchemaTypeDate;