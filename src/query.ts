import BluebirdPromise from 'bluebird';
import { parseArgs, shuffle } from './util';
import type Model from './model';
import type Schema from './schema';
import type Document from './document';
import type { NodeJSLikeCallback, Options } from './types';

abstract class Query<T> {
  data: Document<T>[];
  length: number;
  abstract _model: Model<T>;
  abstract _schema: Schema<T>;

  /**
   * Query constructor.
   *
   * @param {Array} data
   */
  constructor(data: Document<T>[]) {
    this.data = data;
    this.length = data.length;
  }

  /**
   * Returns the number of elements.
   *
   * @return Number
   */
  count(): number {
    return this.length;
  }

  /**
   * Iterates over all documents.
   *
   * @param {Function} iterator
   */
  forEach(iterator: (item: any, index: number) => void): void {
    const { data, length } = this;

    for (let i = 0; i < length; i++) {
      iterator(data[i], i);
    }
  }

  /**
   * Returns an array containing all documents.
   *
   * @return {Array}
   */
  toArray(): Document<T>[] {
    return this.data;
  }

  /**
   * Returns the document at the specified index. `num` can be a positive or
   * negative number.
   *
   * @param {Number} i
   * @return {Document|Object}
   */
  eq(i: number): Document<T> {
    const index = i < 0 ? this.length + i : i;
    return this.data[index];
  }

  /**
   * Returns the first document.
   *
   * @return {Document|Object}
   */
  first(): Document<T> {
    return this.eq(0);
  }

  /**
   * Returns the last document.
   *
   * @return {Document|Object}
   */
  last(): Document<T> {
    return this.eq(-1);
  }

  /**
   * Returns the specified range of documents.
   *
   * @param {Number} start
   * @param {Number} [end]
   * @return {Query}
   */
  slice(start: number, end?: number): Query<T> {
    return Reflect.construct(this.constructor, [this.data.slice(start, end)]);
  }

  /**
   * Limits the number of documents returned.
   *
   * @param {Number} i
   * @return {Query}
   */
  limit(i: number): Query<T> {
    return this.slice(0, i);
  }

  /**
   * Specifies the number of items to skip.
   *
   * @param {Number} i
   * @return {Query}
   */
  skip(i: number): Query<T> {
    return this.slice(i);
  }

  /**
   * Returns documents in a reversed order.
   *
   * @return {Query}
   */
  reverse(): Query<T> {
    return Reflect.construct(this.constructor, [this.data.slice().reverse()]);
  }

  /**
   * Returns documents in random order.
   *
   * @return {Query}
   */
  shuffle(): Query<T> {
    return Reflect.construct(this.constructor, [shuffle(this.data)]);
  }

  /**
   * Finds matching documents.
   *
   * @param {Object} query
   * @param {Object} [options]
   *   @param {Number} [options.limit=0] Limits the number of documents returned.
   *   @param {Number} [options.skip=0] Skips the first elements.
   *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
   * @return {Query|Array}
   */
  find(query: object): Query<T>;
  find(query: object, options: Options): T[] | Query<T>;
  find(query: object, options: Options = {}): T[] | Query<T> {
    const filter = this._schema._execQuery(query);
    const { data, length } = this;
    const { lean = false } = options;
    let { limit = length, skip } = options;
    const arr = [];

    for (let i = 0; limit && i < length; i++) {
      const item = data[i];

      if (filter(item)) {
        if (skip) {
          skip--;
        } else {
          arr.push(lean ? item.toObject() : item);
          limit--;
        }
      }
    }

    return lean ? arr : Reflect.construct(this.constructor, [arr]);
  }

  /**
   * Finds the first matching documents.
   *
   * @param {Object} query
   * @param {Object} [options]
   *   @param {Number} [options.skip=0] Skips the first elements.
   *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
   * @return {Document|Object}
   */
  findOne(query: object): Document<T>;
  findOne(query: object, options): Document<T> | T;
  findOne(query: object, options: Options = {}): Document<T> | T {
    const _options = Object.assign(options, { limit: 1 });

    const result = this.find(query, _options);
    return Array.isArray(result) ? result[0] : result.data[0];
  }

  /**
   * Sorts documents.
   *
   * Example:
   *
   * ``` js
   * query.sort('date', -1);
   * query.sort({date: -1, title: 1});
   * query.sort('-date title');
   * ```
   *
   * If the `order` equals to `-1`, `desc` or `descending`, the data will be
   * returned in reversed order.
   *
   * @param {String|Object} orderby
   * @param {String|Number} [order]
   * @return {Query}
   */
  sort(orderby: string | object, order?: string | number | object): Query<T> {
    const sort = parseArgs(orderby, order);
    const fn = this._schema._execSort(sort);

    return Reflect.construct(this.constructor, [this.data.slice().sort(fn)]);
  }

  /**
   * Creates an array of values by iterating each element in the collection.
   *
   * @param {Function} iterator
   * @return {Array}
   */
  map<T>(iterator: (item: any, index: number) => T): T[] {
    const { data, length } = this;
    const result: T[] = new Array(length);

    for (let i = 0; i < length; i++) {
      result[i] = iterator(data[i], i);
    }

    return result;
  }

  /**
   * Reduces a collection to a value which is the accumulated result of iterating
   * each element in the collection.
   *
   * @param {Function} iterator
   * @param {*} [initial] By default, the initial value is the first document.
   * @return {*}
   */
  reduce<R>(iterator: (pre: any, cur: any, index: number) => R, initial?: R): R {
    const { data, length } = this;
    let result, i: number;

    if (initial === undefined) {
      i = 1;
      result = data[0];
    } else {
      i = 0;
      result = initial;
    }

    for (; i < length; i++) {
      result = iterator(result, data[i], i);
    }

    return result;
  }

  /**
   * Reduces a collection to a value which is the accumulated result of iterating
   * each element in the collection from right to left.
   *
   * @param {Function} iterator
   * @param {*} [initial] By default, the initial value is the last document.
   * @return {*}
   */
  reduceRight<R>(iterator: (pre: any, cur: any, index: number) => R, initial?: R): R {
    const { data, length } = this;
    let result, i;

    if (initial === undefined) {
      i = length - 2;
      result = data[length - 1];
    } else {
      i = length - 1;
      result = initial;
    }

    for (; i >= 0; i--) {
      result = iterator(result, data[i], i);
    }

    return result;
  }

  /**
   * Creates a new array with all documents that pass the test implemented by the
   * provided function.
   *
   * @param {Function} iterator
   * @return {Query}
   */
  filter(iterator: (item: any, index: number) => boolean): Query<T> {
    const { data, length } = this;
    const arr = [];

    for (let i = 0; i < length; i++) {
      const item = data[i];
      if (iterator(item, i)) arr.push(item);
    }

    return Reflect.construct(this.constructor, [arr]);
  }

  /**
   * Tests whether all documents pass the test implemented by the provided
   * function.
   *
   * @param {Function} iterator
   * @return {Boolean}
   */
  every(iterator: (item: any, index: number) => boolean): boolean {
    const { data, length } = this;

    for (let i = 0; i < length; i++) {
      if (!iterator(data[i], i)) return false;
    }

    return true;
  }

  /**
   * Tests whether some documents pass the test implemented by the provided
   * function.
   *
   * @param {Function} iterator
   * @return {Boolean}
   */
  some(iterator: (item: any, index: number) => boolean): boolean {
    const { data, length } = this;

    for (let i = 0; i < length; i++) {
      if (iterator(data[i], i)) return true;
    }

    return false;
  }

  /**
   * Update all documents.
   *
   * @param {Object} data
   * @param {Function} [callback]
   * @return {BluebirdPromise}
   */
  update(data: any, callback?: NodeJSLikeCallback<any>): BluebirdPromise<any> {
    const model = this._model;
    const stack = this._schema._parseUpdate(data);

    return BluebirdPromise.mapSeries(this.data, item => model._updateWithStack(item._id, stack)).asCallback(callback);
  }

  /**
   * Replace all documents.
   *
   * @param {Object} data
   * @param {Function} [callback]
   * @return {BluebirdPromise}
   */
  replace(data: any, callback?: NodeJSLikeCallback<any>): BluebirdPromise<any> {
    const model = this._model;

    return BluebirdPromise.map(this.data, item => model.replaceById(item._id, data)).asCallback(callback);
  }

  /**
   * Remove all documents.
   *
   * @param {Function} [callback]
   * @return {BluebirdPromise}
   */
  remove(callback?: NodeJSLikeCallback<any>): BluebirdPromise<any> {
    const model = this._model;

    return BluebirdPromise.mapSeries(this.data, item => model.removeById(item._id)).asCallback(callback);
  }

  /**
   * Populates document references.
   *
   * @param {String|Object} expr
   * @return {Query}
   */
  populate(expr: string | any[] | { path?: string; model?: any; [key: PropertyKey]: any }): Query<T> {
    const stack = this._schema._parsePopulate(expr);
    const { data, length } = this;
    const model = this._model;

    for (let i = 0; i < length; i++) {
      data[i] = model._populate(data[i], stack);
    }

    return this;
  }

  size: Query<T>['count'];
  each: Query<T>['forEach'];
  random: Query<T>['shuffle'];
}

Query.prototype.size = Query.prototype.count;

Query.prototype.each = Query.prototype.forEach;

Query.prototype.random = Query.prototype.shuffle;

export default Query;
