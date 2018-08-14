'use strict';

const SchemaType = require('../schematype');
const util = require('../util');

/**
 * Object schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Object|Function} [options.default={}]
 * @extends {SchemaType}
 */
function SchemaTypeObject(name, options) {
  SchemaType.call(this, name, Object.assign({
    default: {}
  }, options));
}

util.inherits(SchemaTypeObject, SchemaType);

module.exports = SchemaTypeObject;
