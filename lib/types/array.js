'use strict';

var SchemaType = require('../schematype'),
  util = require('../util');

function SchemaTypeArray(name, options){
  SchemaType.call(this, name, options);

  if (!this.options.child){
    this.options.child = new SchemaType();
  }
}

util.inherits(SchemaTypeArray, SchemaType);

module.exports = SchemaTypeArray;