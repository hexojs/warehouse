import SchemaType from '../schematype';
import ValidationError from '../error/validation';

const { isArray } = Array;

/**
 * Array schema type.
 */
class SchemaTypeArray<I, T extends SchemaType<I>> extends SchemaType<I[]> {
  options: SchemaType<I[]>['options'] & { child?: T; };
  child: T;

  /**
   *
   * @param {String} name
   * @param {Object} [options]
   *   @param {Boolean} [options.required=false]
   *   @param {Array|Function} [options.default=[]]
   *   @param {SchemaType} [options.child]
   */
  constructor(name: string, options?: Partial<SchemaType<I[]>['options']> & { child?: T; }) {
    super(name, Object.assign({
      default: []
    }, options));

    this.child = this.options.child || new SchemaType<any>(name) as T;
  }

  /**
   * Casts an array and its child elements.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Array}
   */
  cast(value_?: unknown, data?: unknown): I[] | null | undefined {
    value_ = super.cast(value_, data);
    if (value_ == null) return value_ as null | undefined;

    const value = isArray(value_) ? value_ : value_ = [value_];
    if (!value.length) return value;

    const child = this.child;

    for (let i = 0, len = value.length; i < len; i++) {
      value[i] = child.cast(value[i], data);
    }

    return value;
  }

  /**
   * Validates an array and its child elements.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Array|Error}
   */
  validate(value_?: unknown, data?: unknown): I[] {
    const value = super.validate(value_, data);

    if (!isArray(value)) {
      throw new ValidationError(`\`${value}\` is not an array!`);
    }

    if (!value.length) return value;

    const child = this.child;

    for (let i = 0, len = value.length; i < len; i++) {
      value[i] = child.validate(value[i], data) as I;
    }

    return value;
  }

  /**
   * Compares an array by its child elements and the size of the array.
   *
   * @param {Array} a
   * @param {Array} b
   * @return {Number}
   */
  compare(a?: I[], b?: I[]): number {
    if (a) {
      if (!b) return 1;
    } else {
      return b ? -1 : 0;
    }

    const lenA = a.length;
    const lenB = b.length;
    const child = this.child;

    for (let i = 0, len = Math.min(lenA, lenB); i < len; i++) {
      const result = child.compare(a[i], b[i]);
      if (result !== 0) return result;
    }

    // Compare by length
    return lenA - lenB;
  }

  /**
   * Parses data.
   *
   * @param {Array} value
   * @return {Array}
   */
  parse(value?: unknown[]) {
    if (!value) return value;

    const len = value.length;
    if (!len) return [];

    const result = new Array(len);
    const child = this.child;

    for (let i = 0; i < len; i++) {
      result[i] = child.parse(value[i]);
    }

    return result;
  }

  /**
   * Transforms data.
   *
   * @param {Array} value
   * @param {Object} data
   * @return {Array}
   */
  value(value?: unknown[], data?: unknown): any[] {
    if (!value) return value;

    const len = value.length;
    if (!len) return [];

    const result = new Array(len);
    const child = this.child;

    for (let i = 0; i < len; i++) {
      result[i] = child.value(value[i], data);
    }

    return result;
  }

  /**
   * Checks the equality of an array.
   *
   * @param {Array} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  match(value?: I[], query?: unknown[], data?: unknown): boolean {
    if (!value || !query) {
      return value === query;
    }

    const lenA = value.length;
    const lenB = query.length;

    if (lenA !== lenB) return false;

    const child = this.child;

    for (let i = 0; i < lenA; i++) {
      if (!child.match(value[i], query[i], data)) return false;
    }

    return true;
  }

  /**
   * Checks whether the number of elements in an array is equal to `query`.
   *
   * @param {Array} value
   * @param {Number} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$size(value?: unknown[], query?: unknown, data?: unknown): boolean {
    return (value ? value.length : 0) === query;
  }

  /**
   * Checks whether an array contains one of elements in `query`.
   *
   * @param {Array} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$in(value?: unknown[], query?: unknown[], data?: unknown): boolean {
    if (!value) return false;

    for (let i = 0, len = query.length; i < len; i++) {
      if (value.includes(query[i])) return true;
    }

    return false;
  }

  /**
   * Checks whether an array does not contain in any elements in `query`.
   *
   * @param {Array} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$nin(value?: unknown[], query?: unknown[], data?: unknown): boolean {
    if (!value) return true;

    for (let i = 0, len = query.length; i < len; i++) {
      if (value.includes(query[i])) return false;
    }

    return true;
  }

  /**
   * Checks whether an array contains all elements in `query`.
   *
   * @param {Array} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$all(value?: unknown[], query?: unknown[], data?: unknown): boolean {
    if (!value) return false;

    for (let i = 0, len = query.length; i < len; i++) {
      if (!value.includes(query[i])) return false;
    }

    return true;
  }

  /**
   * Add elements to an array.
   *
   * @param {Array} value
   * @param {*} update
   * @param {Object} data
   * @return {Array}
   */
  u$push<T>(value?: T[], update?: T | T[], data?: unknown): T[] {
    if (isArray(update)) {
      return value ? value.concat(update) : update;
    }

    if (value) {
      value.push(update);
      return value;
    }

    return [update];
  }

  /**
   * Add elements in front of an array.
   *
   * @param {Array} value
   * @param {*} update
   * @param {Object} data
   * @return {Array}
   */
  u$unshift(value?: unknown[], update?: unknown, data?: unknown): any[] {
    if (isArray(update)) {
      return value ? update.concat(value) : update;
    }

    if (value) {
      value.unshift(update);
      return value;
    }

    return [update];
  }

  /**
   * Removes elements from an array.
   *
   * @param {Array} value
   * @param {*} update
   * @param {Object} data
   * @return {Array}
   */
  u$pull(value?: unknown[], update?: unknown, data?: unknown): any[] {
    if (!value) return value;

    if (isArray(update)) {
      return value.filter(item => !update.includes(item));
    }

    return value.filter(item => item !== update);
  }

  /**
   * Removes the first element from an array.
   *
   * @param {Array} value
   * @param {Number|Boolean} update
   * @param {Object} data
   * @return {Array}
   */
  u$shift(value?, update?, data?) {
    if (!value || !update) return value;

    if (update === true) {
      return value.slice(1);
    } else if (update > 0) {
      return value.slice(update);
    }

    return value.slice(0, value.length + update);
  }

  /**
   * Removes the last element from an array.
   *
   * @param {Array} value
   * @param {Number|Boolean} update
   * @param {Object} data
   * @return {Array}
   */
  u$pop(value?, update?, data?) {
    if (!value || !update) return value;

    const length = value.length;

    if (update === true) {
      return value.slice(0, length - 1);
    } else if (update > 0) {
      return value.slice(0, length - update);
    }

    return value.slice(-update, length);
  }

  /**
   * Add elements to an array only if the value is not already in the array.
   *
   * @param {Array} value
   * @param {*} update
   * @param {Object} data
   * @return {Array}
   */
  u$addToSet(value?: any[], update?, data?) {
    if (isArray(update)) {
      if (!value) return update;

      for (let i = 0, len = update.length; i < len; i++) {
        const item = update[i];
        if (!value.includes(item)) value.push(item);
      }

      return value;
    }

    if (!value) return [update];

    if (!value.includes(update)) {
      value.push(update);
    }

    return value;
  }
  q$length: SchemaTypeArray<I, T>['q$size'];
  u$append: SchemaTypeArray<I, T>['u$push'];
  u$prepend: SchemaTypeArray<I, T>['u$unshift'];
}

SchemaTypeArray.prototype.q$length = SchemaTypeArray.prototype.q$size;

SchemaTypeArray.prototype.u$append = SchemaTypeArray.prototype.u$push;

SchemaTypeArray.prototype.u$prepend = SchemaTypeArray.prototype.u$unshift;

export default SchemaTypeArray;
