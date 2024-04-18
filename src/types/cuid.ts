import SchemaType from '../schematype';
import { nanoid } from 'nanoid';
import ValidationError from '../error/validation';

/**
 * [CUID](https://github.com/ai/nanoid) schema type.
 */
class SchemaTypeCUID extends SchemaType<string> {

  /**
   * Casts data. Returns a new CUID only if value is null and the field is
   * required.
   *
   * @param {String} value
   * @return {String}
   */
  cast(value?: string): string {
    if (value == null && this.options.required) {
      return 'cuid' + nanoid();
    }

    return value;
  }

  /**
   * Validates data. A valid CUID must be started with `c` and 25 in length.
   *
   * @param {*} value
   * @return {String|Error}
   */
  validate(value?: string): string {
    if (value && (value[0] !== 'c' || value.length !== 25)) {
      throw new ValidationError(`\`${value}\` is not a valid CUID`);
    }

    return value;
  }
}

export default SchemaTypeCUID;
