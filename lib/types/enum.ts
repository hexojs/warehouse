'use strict';

import ValidationError from '../error/validation';
import SchemaType from '../schematype';

/**
 * Enum schema type.
 */
class SchemaTypeEnum extends SchemaType {
  options: any;

  /**
   *
   * @param {String} name
   * @param {Object} options
   *   @param {Boolean} [options.required=false]
   *   @param {Array} options.elements
   *   @param {*} [options.default]
   */
  constructor(name:string, options) {
    super(name, Object.assign({
      elements: []
    }, options));
  }

  /**
   * Validates data. The value must be one of elements set in the options.
   *
   * @param {*} value
   * @param {Object} data
   * @return {*}
   */
  validate(value_, data: any): any {
    const value = super.validate(value_, data);
    const elements = this.options.elements;

    if (!elements.includes(value)) {
      throw new ValidationError(`The value must be one of ${elements.join(', ')}`);
    }

    return value;
  }
}

export default SchemaTypeEnum;
