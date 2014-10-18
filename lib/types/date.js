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

SchemaTypeDate.prototype.match = function(value, query, data){
  return value ? value.getTime() === query.getTime() : false;
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

SchemaTypeDate.prototype.q$day = function(value, query, data){
  return value ? value.getDate() === query : false;
};

SchemaTypeDate.prototype.q$month = function(value, query, data){
  return value ? value.getMonth() === query : false;
};

SchemaTypeDate.prototype.q$year = function(value, query, data){
  return value ? value.getFullYear() === query : false;
};

SchemaTypeDate.prototype.u$inc = function(value, update, data){
  if (value) return new Date(value.getTime() + update);
};

SchemaTypeDate.prototype.u$add = SchemaTypeDate.prototype.u$inc;

SchemaTypeDate.prototype.u$dec = function(value, update, data){
  if (value) return new Date(value.getTime() - update);
};

SchemaTypeDate.prototype.u$sub = SchemaTypeDate.prototype.u$dec;

SchemaTypeDate.prototype.u$subtract = SchemaTypeDate.prototype.u$dec;

module.exports = SchemaTypeDate;