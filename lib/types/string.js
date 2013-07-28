var _ = require('lodash'),
  SchemaType = require('../schematype');

var SchemaString = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaString.type = SchemaString.prototype.type = String;

SchemaString.prototype.__proto__ = SchemaType.prototype;

SchemaString.prototype.checkRequired = function(value){
  return (value instanceof String || typeof value === 'string') && value.length;
};

SchemaString.prototype.cast = function(value){
  if (value === null) return value;
  if (value instanceof String || typeof value === 'string') return value;

  if (value.toString){
    return value.toString();
  } else {
    return null;
  }
};

var compare = SchemaString.compare = function(data, value){
  if (value instanceof RegExp){
    return value.test(data);
  } else {
    return data == value;
  }
};

var queryOperators = SchemaString.queryOperators = _.clone(SchemaType.queryOperators);

queryOperators.ne = queryOperators.not = function(data, value){
  return !compare(data, value);
};