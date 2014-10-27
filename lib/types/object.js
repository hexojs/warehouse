'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  fast = require('fast.js');

/**
 * Object schema type.
 *
 * @class SchemaTypeObject
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Object|Function} [options.default={}]
 * @constructor
 * @extends {SchemaType}
 * @module warehouse
 */
function SchemaTypeObject(name, options){
  SchemaType.call(this, name, fast.assign({
    default: {}
  }, options));
}

util.inherits(SchemaTypeObject, SchemaType);

module.exports = SchemaTypeObject;