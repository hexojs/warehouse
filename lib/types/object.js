'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  fast = require('fast.js');

function SchemaTypeObject(name, options){
  SchemaType.call(this, name, fast.assign({
    default: {}
  }, options));
}

util.inherits(SchemaTypeObject, SchemaType);

module.exports = SchemaTypeObject;