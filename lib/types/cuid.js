'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  cuid = require('cuid');

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

module.exports = SchemaTypeCUID;