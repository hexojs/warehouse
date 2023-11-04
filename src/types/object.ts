import SchemaType from '../schematype';

/**
 * Object schema type.
 */
class SchemaTypeObject extends SchemaType<Record<string, any>> {

  /**
   *
   * @param {String} [name]
   * @param {Object} [options]
   *   @param {Boolean} [options.required=false]
   *   @param {Object|Function} [options.default={}]
   */
  constructor(name?: string, options?: Partial<SchemaType<Record<string, any>>['options']>) {
    super(name, Object.assign({ default: {} }, options));
  }
}

export default SchemaTypeObject;
