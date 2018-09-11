'use strict';

const SchemaType = require('../schematype');

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
class SchemaTypeObject extends SchemaType {
  constructor(name, options) {
    super(name, Object.assign({
      default: {}
    }, options));
  }
}

module.exports = SchemaTypeObject;
