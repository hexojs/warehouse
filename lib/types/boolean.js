'use strict';

var SchemaType = require('../schematype'),
  util = require('../util');

function SchemaTypeBoolean(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeBoolean, SchemaType);

SchemaTypeBoolean.prototype.parse = function(value, data){
  return Boolean(value);
};

SchemaTypeBoolean.prototype.value = function(value, data){
  return +value;
};

module.exports = SchemaTypeBoolean;