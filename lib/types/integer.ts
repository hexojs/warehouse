'use strict';

import ValidationError from '../error/validation';
import SchemaTypeNumber from './number';

/**
 * Integer schema type.
 */
class SchemaTypeInteger extends SchemaTypeNumber {

  /**
   * Casts a integer.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number}
   */
  cast(value_:any, data: any): number {
    const value = super.cast(value_, data);

    return parseInt(value.toString(), 10);
  }

  /**
   * Validates an integer.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number|Error}
   */
  validate(value_:any, data: any): number | Error {
    const value:any = super.validate(value_, data);

    if (value % 1 !== 0) {
      throw new ValidationError(`\`${value}\` is not an integer!`);
    }

    return value;
  }
}

export default SchemaTypeInteger;
