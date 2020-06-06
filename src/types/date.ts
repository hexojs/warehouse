import SchemaType = require('../schematype');
import ValidationError = require('../error/validation');

/**
 * Date schema type.
 */
class SchemaTypeDate extends SchemaType<Date> {

  /**
   * Casts data.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Date}
   */
  cast(value: Date, data): Date;
  cast(value: null, data): Date | null;
  cast(value: undefined, data): Date | undefined;
  cast(value: unknown, data): Date | null | undefined;
  cast(value_, data): Date | null | undefined {
    const value = super.cast(value_, data);

    if (value == null || value instanceof Date) return value as Date | null | undefined;

    return new Date(value as any);
  }

  /**
   * Validates data.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Date|Error}
   */
  validate(value_, data) {
    const value = super.validate(value_, data);

    if (value != null && (!(value instanceof Date) || isNaN(value.getTime()))) {
      throw new ValidationError(`\`${value}\` is not a valid date!`);
    }

    return value;
  }

  /**
   * Checks the equality of data.
   *
   * @param {Date} value
   * @param {Date} query
   * @param {Object} data
   * @return {Boolean}
   */
  match(value: Date, query: Date, data): boolean {
    if (!value || !query) {
      return value === query;
    }

    return value.getTime() === query.getTime();
  }

  /**
   * Compares between two dates.
   *
   * @param {Date} a
   * @param {Date} b
   * @return {Number}
   */
  compare(a, b) {
    if (a) {
      return b ? a - b : 1;
    }

    return b ? -1 : 0;
  }

  /**
   * Parses data and transforms it into a date object.
   *
   * @param {*} value
   * @return {Date}
   */
  parse(value) {
    if (value) return new Date(value);
  }

  /**
   * Transforms a date object to a string.
   *
   * @param {Date} value
   * @param {Object} data
   * @return {String}
   */
  value(value, data) {
    return value ? value.toISOString() : value;
  }

  /**
   * Finds data by its date.
   *
   * @param {Date} value
   * @param {Number} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$day(value, query, data) {
    return value ? value.getDate() === query : false;
  }

  /**
   * Finds data by its month. (Start from 0)
   *
   * @param {Date} value
   * @param {Number} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$month(value, query, data) {
    return value ? value.getMonth() === query : false;
  }

  /**
   * Finds data by its year. (4-digit)
   *
   * @param {Date} value
   * @param {Number} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$year(value, query, data) {
    return value ? value.getFullYear() === query : false;
  }

  /**
   * Adds milliseconds to date.
   *
   * @param {Date} value
   * @param {Number} update
   * @param {Object} data
   * @return {Date}
   */
  u$inc(value, update, data) {
    if (value) return new Date(value.getTime() + update);
  }

  /**
   * Subtracts milliseconds from date.
   *
   * @param {Date} value
   * @param {Number} update
   * @param {Object} data
   * @return {Date}
   */
  u$dec(value, update, data) {
    if (value) return new Date(value.getTime() - update);
  }
}

export = SchemaTypeDate;
