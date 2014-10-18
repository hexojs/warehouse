'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  ValidationError = require('../error/validation');

function SchemaTypeReference(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeReference, SchemaType);

module.exports = SchemaTypeReference;