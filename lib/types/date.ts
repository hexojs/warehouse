'use strict';

import ValidationError from '../error/validation';
import SchemaType from '../schematype';

/**
 * Date schema type.
 */
class SchemaTypeDate extends SchemaType {

  /**
   * Casts data.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Date}
   */
  cast(value_, data: any): Date {
    const value = super.cast(value_, data);

    if (value == null || value instanceof Date) return value;

    return new Date(value);
  }

  /**
   * Validates data.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Date|Error}
   */
  validate(value_, data: any): Date | Error {
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
   * @param {Object} _data
   * @return {Boolean}
   */
  match(value: Date, query: Date, _data: any): boolean {
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
  compare(a: Date, b: Date): number {
    if (a) {
      return b ? a - b : 1;
    }

    return b ? -1 : 0;
  }

  /**
   * Parses data and transforms it into a date object.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Date}
   */
  parse(value: any,): Date {
    if (value) return new Date(value);
  }

  /**
   * Transforms a date object to a string.
   *
   * @param {Date} value
   * @param {Object} data
   * @return {String}
   */
  value(value: Date): string {
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
  q$day(value: Date, query: number): boolean {
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
  q$month(value: Date, query: number): boolean {
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
  q$year(value: Date, query: number): boolean {
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
  u$inc(value: Date, update: number): Date {
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
  u$dec(value: Date, update: number): Date {
    if (value) return new Date(value.getTime() - update);
  }
}

export default SchemaTypeDate;
