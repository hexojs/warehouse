'use strict';

var SchemaType = require('../schematype');
var util = require('../util');

var extend = util.extend;

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
  SchemaType.call(this, name, extend({
    default: {}
  }, options));
}

util.inherits(SchemaTypeObject, SchemaType);

module.exports = SchemaTypeObject;