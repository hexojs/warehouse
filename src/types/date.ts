import SchemaType from '../schematype';
import ValidationError from '../error/validation';

/**
 * Date schema type.
 */
class SchemaTypeDate extends SchemaType<Date> {

  /**
   * Casts data.
   *
   * @param {*} value_
   * @return {Date | null | undefined}
   */
  cast(value_: Date | number | string): Date;
  cast(value_?: unknown): Date | null | undefined;
  cast(value_?: unknown): Date | null | undefined {
    const value = super.cast(value_, null);

    if (value == null || value instanceof Date) return value as Date | null | undefined;

    return new Date(value as any);
  }

  /**
   * Validates data.
   *
   * @param {*} value_
   * @param {Object} data
   * @return {Date|Error}
   */
  validate(value_: unknown, data?: unknown): Date {
    const value = super.validate(value_, data);

    if (value != null && (!(value instanceof Date) || isNaN(value.getTime()))) {
      throw new ValidationError(`\`${value}\` is not a valid date!`);
    }

    return value as Date;
  }

  /**
   * Checks the equality of data.
   *
   * @param {Date} value
   * @param {Date} query
   * @return {Boolean}
   */
  match(value: Date, query: Date): boolean {
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
  compare(a?: Date, b?: Date): number {
    if (a) {
      return b ? (a as unknown as number) - (b as unknown as number) : 1;
    }

    return b ? -1 : 0;
  }

  /**
   * Parses data and transforms it into a date object.
   *
   * @param {*} value
   * @return {Date}
   */
  parse(value: string | number | Date): Date;
  parse(): undefined;
  parse(value?: string | number | Date): Date | undefined {
    if (value) return new Date(value);
  }

  /**
   * Transforms a date object to a string.
   *
   * @param {Date} value
   * @return {String}
   */
  value(value: Date): string;
  value(): undefined;
  value(value?: Date): string | undefined {
    return value ? value.toISOString() : value as undefined;
  }

  /**
   * Finds data by its date.
   *
   * @param {Date} value
   * @param {Number} query
   * @return {Boolean}
   */
  q$day(value: Date | undefined, query: number): boolean {
    return value ? value.getDate() === query : false;
  }

  /**
   * Finds data by its month. (Start from 0)
   *
   * @param {Date} value
   * @param {Number} query
   * @return {Boolean}
   */
  q$month(value: Date | undefined, query: number): boolean {
    return value ? value.getMonth() === query : false;
  }

  /**
   * Finds data by its year. (4-digit)
   *
   * @param {Date} value
   * @param {Number} query
   * @return {Boolean}
   */
  q$year(value: Date | undefined, query: number): boolean {
    return value ? value.getFullYear() === query : false;
  }

  /**
   * Adds milliseconds to date.
   *
   * @param {Date} value
   * @param {Number} update
   * @return {Date}
   */
  u$inc(value: Date | undefined, update: number): Date {
    if (value) return new Date(value.getTime() + update);
  }

  /**
   * Subtracts milliseconds from date.
   *
   * @param {Date} value
   * @param {Number} update
   * @return {Date}
   */
  u$dec(value: Date | undefined, update: number): Date {
    if (value) return new Date(value.getTime() - update);
  }
}

export default SchemaTypeDate;
