var SchemaType = require('../schematype');

var SchemaBoolean = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaBoolean.type = SchemaBoolean.prototype.type = Boolean;

SchemaBoolean.prototype.__proto__ = SchemaType.prototype;

SchemaBoolean.prototype.checkRequired = function(value){
  return value === true || value === false;
};

SchemaBoolean.prototype.cast = function(value){
  if (value === null) return value;
  if ('0' === value) return false;
  if ('true' === value) return true;
  if ('false' === value) return false;

  return !!value;
};

SchemaBoolean.compare = SchemaType.compare;