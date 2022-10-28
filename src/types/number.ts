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
  cast(value_?, data?): number | null | undefined {
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
  validate(value_?, data?) {
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
   * @return {Number}
   */
  u$inc(value, update) {
    return value ? value + update : update;
  }

  /**
   * Subtracts value from a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$dec(value, update) {
    return value ? value - update : -update;
  }

  /**
   * Multiplies value to a number.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$mul(value, update) {
    return value ? value * update : 0;
  }

  /**
   * Divides a number by a value.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$div(value, update) {
    return value ? value / update : 0;
  }

  /**
   * Divides a number by a value and returns the remainder.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$mod(value, update) {
    return value ? value % update : 0;
  }

  /**
   * Updates a number if the value is greater than the current value.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$max(value, update) {
    return update > value ? update : value;
  }

  /**
   * Updates a number if the value is less than the current value.
   *
   * @param {Number} value
   * @param {Number} update
   * @return {Number}
   */
  u$min(value, update) {
    return update < value ? update : value;
  }
}

export default SchemaTypeNumber;
