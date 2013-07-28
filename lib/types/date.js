var _ = require('lodash'),
  SchemaType = require('../schematype');

var SchemaDate = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaDate.type = SchemaDate.prototype.type = Date;

SchemaDate.prototype.__proto__ = SchemaType.prototype;

SchemaDate.prototype.checkRequired = function(value){
  return value instanceof Date;
};

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

SchemaDate.compare = function(data, value){
  return data.valueOf() === cast(value).valueOf();
};

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

var updateOperators = SchemaDate.updateOperators = _.clone(SchemaType.updateOperators);

updateOperators.inc = function(data, value){
  if (!data) return;

  return new Date(data.valueOf() + +value);
};

updateOperators.dec = function(data, value){
  if (!data) return;

  return new Date(data.valueOf() - +value);
};