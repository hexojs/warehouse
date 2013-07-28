var _ = require('lodash'),
  SchemaType = require('../schematype');

var SchemaNumber = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaNumber.type = SchemaNumber.prototype.type = Number;

SchemaNumber.prototype.__proto__ = SchemaType.prototype;

SchemaNumber.prototype.checkRequired = function(value){
  return value instanceof Number || typeof value === 'number';
};

SchemaNumber.prototype.cast = function(value){
  if (value === null) return value;
  if (value === '') return null;
  if (value instanceof Number || typeof value === 'number') return value;
  if (!isNaN(+value)) return +value;

  return null;
};

SchemaNumber.compare = SchemaType.compare;

var updateOperators = SchemaNumber.updateOperators = _.clone(SchemaType.updateOperators);

updateOperators.inc = function(data, value){
  if (!data) return +value;

  return data + +value;
};

updateOperators.dec = function(data, value){
  if (!data) return -+value;

  return data - +value;
};