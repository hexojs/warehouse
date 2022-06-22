import SchemaType from '../schematype';
import ValidationError from '../error/validation';

/**
 * Boolean schema type.
 */
class SchemaTypeBoolean extends SchemaType<boolean> {

  /**
   * Casts a boolean.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Boolean}
   */
  cast(value_: unknown, data: unknown): boolean {
    const value = super.cast(value_, data);

    if (value === 'false' || value === '0') return false;

    return Boolean(value);
  }

  /**
   * Validates a boolean.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Boolean|Error}
   */
  validate(value_: unknown, data: unknown): boolean {
    const value = super.validate(value_, data);

    if (value != null && typeof value !== 'boolean') {
      throw new ValidationError(`\`${value}\` is not a boolean!`);
    }

    return value as boolean;
  }

  /**
   * Parses data and transform them into boolean values.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Boolean}
   */
  parse(value: unknown): boolean {
    return Boolean(value);
  }

  /**
   * Transforms data into number to compress the size of database files.
   *
   * @param {Boolean} value
   * @param {Object} data
   * @return {Number}
   */
  value(value: unknown, data: unknown): number {
    return +value;
  }
}

export default SchemaTypeBoolean;
