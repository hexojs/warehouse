import rfdc from 'rfdc';
import type Model from './model';
import type Schema from './schema';
import type { NodeJSLikeCallback } from './types';
const cloneDeep = rfdc();

abstract class Document<T> {
  abstract _model: Model<T>;
  _id!: string | number | undefined;
  abstract _schema: Schema;
  [key : string]: any;

  /**
   * Document constructor.
   *
   * @param {object} data
   */
  constructor(data?: T) {
    if (data) {
      Object.assign(this, data);
    }
  }

  /**
   * Saves the document.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  save(callback?: NodeJSLikeCallback<any>): Promise<any> {
    return this._model.save(this, callback);
  }

  /**
   * Updates the document.
   *
   * @param {object} data
   * @param {function} [callback]
   * @return {Promise}
   */
  update(data: object, callback?: NodeJSLikeCallback<any>): Promise<any> {
    return this._model.updateById(this._id, data, callback);
  }

  /**
   * Replaces the document.
   *
   * @param {object} data
   * @param {function} [callback]
   * @return {Promise}
   */
  replace(data: T | Document<T>, callback?: NodeJSLikeCallback<any>): Promise<any> {
    return this._model.replaceById(this._id, data, callback);
  }

  /**
   * Removes the document.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  remove(callback?: NodeJSLikeCallback<any>): Promise<any> {
    return this._model.removeById(this._id, callback);
  }

  /**
   * Returns a plain JavaScript object.
   *
   * @return {object}
   */
  toObject(): T {
    const keys = Object.keys(this);
    const obj: Partial<T> = {};

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      // Don't deep clone getters in order to avoid "Maximum call stack size
      // exceeded" error
      obj[key] = isGetter(this, key) ? this[key] : cloneDeep(this[key]);
    }

    return obj as T;
  }

  /**
   * Returns a string representing the document.
   *
   * @return {String}
   */
  toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Populates document references.
   *
   * @param {String|Object} expr
   * @return {Document}
   */
  populate(expr: string | any[] | { path?: string; model?: any; [key: PropertyKey]: any }): Document<T> {
    const stack = this._schema._parsePopulate(expr);
    return this._model._populate(this, stack);
  }
}

function isGetter(obj: any, key: PropertyKey): any {
  return Object.getOwnPropertyDescriptor(obj, key).get;
}

export default Document;
