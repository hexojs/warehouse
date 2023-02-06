import SchemaType from '../schematype';
import { createId, getConstants } from '@paralleldrive/cuid2';
import ValidationError from '../error/validation';

/**
 * [CUID](https://github.com/ericelliott/cuid) schema type.
 */
class SchemaTypeCUID extends SchemaType<string> {

  /**
   * Casts data. Returns a new CUID only if value is null and the field is
   * required.
   *
   * @param {String} value
   * @return {String}
   */
  cast(value?) {
    if (value == null && this.options.required) {
      return createId();
    }

    return value;
  }

  /**
   * Validates data. A valid CUID must be 24 in length.
   *
   * @param {*} value
   * @return {String|Error}
   */
  validate(value?) {
    if (value && (value.length !== getConstants().defaultLength)) {
      throw new ValidationError(`\`${value}\` is not a valid CUID`);
    }

    return value;
  }
}

export default SchemaTypeCUID;
