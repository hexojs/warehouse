var SchemaType = require('../schematype');

var SchemaString = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaString.prototype.type = String;

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

SchemaString.prototype.queryOperators = {
  ne: function(data, value){
    return data == null ? false : data != value;
  }
};