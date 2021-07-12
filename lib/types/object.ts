'use strict';

import SchemaType from '../schematype';

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
  constructor(name:string, options:any) {
    super(name, Object.assign({ default: {} }, options));
  }
}

export default SchemaTypeObject;
