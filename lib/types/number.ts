'use strict';

import ValidationError from '../error/validation';
import SchemaType from '../schematype';

/**
 * Number schema type.
 */
class SchemaTypeNumber extends SchemaType {

  /**
   * Casts a number.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number}
   */
  cast(value_, data: any): number {
    const value = super.cast(value_, data);

    if (value == null || typeof value === 'number') return value;

    return +value;
  }

  /**
   * Validates a number.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number|Error}
   */
  validate(value_:any, data: any): number | Error {
    const value = super.validate(value_, data);

    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
      throw new ValidationError(`\`${value}\` is not a number!`);
    }

    return value;
  }

  /**
   * Adds value to a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$inc(value: number, update: number, data: any): number {
    return value ? value + update : update;
  }

  /**
   * Subtracts value from a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$dec(value: number, update: number, data: any): number {
    return value ? value - update : -update;
  }

  /**
   * Multiplies value to a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$mul(value: number, update: number, data: any): number {
    return value ? value * update : 0;
  }

  /**
   * Divides a number by a value.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$div(value:number, update:number, data:any):number {
    return value ? value / update : 0;
  }

  /**
   * Divides a number by a value and returns the remainder.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$mod(value:number, update:number, data:any):number {
    return value ? value % update : 0;
  }

  /**
   * Updates a number if the value is greater than the current value.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$max(value:number, update:number, data:any):number {
    return update > value ? update : value;
  }

  /**
   * Updates a number if the value is less than the current value.
   *
   * @param {Number} value
   * @param {Number} update
   * @param {Object} data
   * @return {Number}
   */
  u$min(value:number, update:number, data:number):number {
    return update < value ? update : value;
  }
}

export default SchemaTypeNumber;
