import SchemaType from '../schematype.js';

/**
 * Object schema type.
 */
class SchemaTypeObject extends SchemaType {

  /**
   *
   * @param {String} name
   * @param {Object} [options]
   *   @param {Boolean} [options.required=false]
   *   @param {Object|Function} [options.default={}]
   */
  constructor(name, options) {
    super(name, Object.assign({ default: {} }, options));
  }
}

export default SchemaTypeObject;
