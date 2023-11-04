import SchemaType from '../schematype';
import ValidationError from '../error/validation';

/**
 * Number schema type.
 */
class SchemaTypeNumber extends SchemaType<number> {

  /**
   * Casts a number.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number}
   */
  cast(value_: Exclude<unknown, undefined | null>, data?: unknown): number;
  cast(value_?: unknown, data?: unknown): number | null | undefined;
  cast(value_?: unknown, data?: unknown): number | null | undefined {
    const value = super.cast(value_, data);

    if (value == null || typeof value === 'number') return value as number | null | undefined;

    return +value;
  }

  /**
   * Validates a number.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Number|Error}
   */
  validate(value_?: unknown, data?: unknown): number {
    const value = super.validate(value_, data);

    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
      throw new ValidationError(`\`${value}\` is not a number!`);
    }

    return value as number;
  }

  /**
   * Adds value to a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$inc(value: number | undefined, update: number): number {
    return value ? value + update : update;
  }

  /**
   * Subtracts value from a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$dec(value: number | undefined, update: number): number {
    return value ? value - update : -update;
  }

  /**
   * Multiplies value to a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$mul(value: number | undefined, update: number): number {
    return value ? value * update : 0;
  }

  /**
   * Divides a number by a value.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$div(value: number | undefined, update: number): number {
    return value ? value / update : 0;
  }

  /**
   * Divides a number by a value and returns the remainder.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$mod(value: number | undefined, update: number): number {
    return value ? value % update : 0;
  }

  /**
   * Updates a number if the value is greater than the current value.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$max(value: number | undefined, update: number): number {
    return update > value ? update : value;
  }

  /**
   * Updates a number if the value is less than the current value.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$min(value: number | undefined, update: number): number {
    return update < value ? update : value;
  }
}

export default SchemaTypeNumber;
