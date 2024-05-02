import SchemaType from '../schematype';
import { setGetter } from '../util';

/**
 * Virtual schema type.
 */
class SchemaTypeVirtual<T = any> extends SchemaType<any> {
  getter: ((this: T) => any) | undefined;
  setter: ((value: any) => void) | undefined;

  /**
   * Add a getter.
   *
   * @param {Function} fn
   * @chainable
   */
  get(fn: (this: T) => any): SchemaTypeVirtual<T> {
    if (typeof fn !== 'function') {
      throw new TypeError('Getter must be a function!');
    }

    this.getter = fn;

    return this;
  }

  /**
   * Add a setter.
   *
   * @param {Function} fn
   * @chainable
   */
  set(fn: (this: T, value: any) => void): SchemaTypeVirtual<T> {
    if (typeof fn !== 'function') {
      throw new TypeError('Setter must be a function!');
    }

    this.setter = fn;

    return this;
  }

  /**
   * Applies getters.
   *
   * @param {*} value
   * @param {Object} data
   * @return {*}
   */
  cast(value: unknown, data: any): void {
    if (typeof this.getter !== 'function') return;

    const getter = this.getter;
    let hasCache = false;
    let cache;

    setGetter(data, this.name, () => {
      if (!hasCache) {
        cache = getter.call(data);
        hasCache = true;
      }

      return cache;
    });
  }

  /**
   * Applies setters.
   *
   * @param {*} value
   * @param {Object} data
   */
  validate(value: any, data: any): void {
    if (typeof this.setter === 'function') {
      this.setter.call(data, value);
    }
  }
}

export default SchemaTypeVirtual;
