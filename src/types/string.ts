import SchemaType from '../schematype';
import ValidationError from '../error/validation';

/**
 * String schema type.
 */
class SchemaTypeString extends SchemaType<string> {

  /**
   * Casts a string.
   *
   * @param {*} value_
   * @param {Object} data
   * @return {String}
   */
  cast(value_: { toString(): string }, data?: unknown): string;
  cast(value_?: unknown, data?: unknown): string | null | undefined;
  cast(value_?: unknown, data?: unknown): string | null | undefined {
    const value = super.cast(value_, data);

    if (value == null || typeof value === 'string') return value as string | null | undefined;
    if (typeof value.toString === 'function') return value.toString();
  }

  /**
   * Validates a string.
   *
   * @param {*} value_
   * @param {Object} data
   * @return {String|Error}
   */
  validate(value_?: unknown, data?: unknown): string {
    const value = super.validate(value_, data);

    if (value !== undefined && typeof value !== 'string') {
      throw new ValidationError(`\`${value}\` is not a string!`);
    }

    return value as string;
  }

  /**
   * Checks the equality of data.
   *
   * @param {*} value
   * @param {String|RegExp} query
   * @param {Object} data
   * @return {Boolean}
   */
  match(value: string | undefined, query: string | RegExp | undefined, data?: unknown): boolean {
    if (!value || !query) {
      return value === query;
    }

    if (typeof (query as any).test === 'function') {
      return (query as RegExp).test(value);
    }

    return value === query;
  }

  /**
   * Checks whether a string is equal to one of elements in `query`.
   *
   * @param {String} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$in(value: string | undefined, query: string[] | RegExp[], data?: unknown): boolean {
    for (let i = 0, len = query.length; i < len; i++) {
      if (this.match(value, query[i], data)) return true;
    }

    return false;
  }

  /**
   * Checks whether a string is not equal to any elements in `query`.
   *
   * @param {String} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$nin(value: string | undefined, query: string[] | RegExp[], data?: unknown): boolean {
    return !this.q$in(value, query, data);
  }

  /**
   * Checks length of a string.
   *
   * @param {String} value
   * @param {Number} query
   * @return {Boolean}
   */
  q$length(value: string | undefined, query: number): boolean {
    return (value ? value.length : 0) === query;
  }
}

export default SchemaTypeString;
