import { parse as createJsonParseStream } from './lib/jsonstream';
import BluebirdPromise from 'bluebird';
import { promises as fsPromises, createReadStream } from 'graceful-fs';
import { pipeline, Stream } from 'stream';
import Model from './model';
import Schema from './schema';
import SchemaType from './schematype';
import WarehouseError from './error';
import { logger } from 'hexo-log';
import type { AddSchemaTypeOptions, NodeJSLikeCallback } from './types';

const log = logger();
const pkg = require('../package.json');
const { open } = fsPromises;
const pipelineAsync = BluebirdPromise.promisify(pipeline) as unknown as (...args: Stream[]) => BluebirdPromise<unknown>;

async function exportAsync(database: Database, path: string): Promise<void> {
  const handle = await open(path, 'w');

  try {
    // Start body & Meta & Start models
    await handle.write(`{"meta":${JSON.stringify({
      version: database.options.version,
      warehouse: pkg.version
    })},"models":{`);

    const models = database._models;
    const keys = Object.keys(models);
    const { length } = keys;

    // models body
    for (let i = 0; i < length; i++) {
      const key = keys[i];

      if (!models[key]) continue;

      let prefix = '';
      if (i) {
        prefix = ',';
      }
      await handle.write(`${prefix}"${key}":${models[key]._export()}`);
    }
    // End models
    await handle.write('}}');
  } catch (e) {
    log.error(e);
    if (e instanceof RangeError && e.message.includes('Invalid string length')) {
      // NOTE:  Currently, we can't deal with anything about this issue.
      //        If do not `catch` the exception after the process will not work (e.g: `after_generate` filter.)
      //        A side-effect of this workaround is the `db.json` will not generate.
      log.warn('see: https://github.com/nodejs/node/issues/35973');
    } else {
      throw e;
    }
  } finally {
    await handle.close();
  }
}

interface DatabaseOptions {
  version: number,
  path: string,
  onUpgrade: (oldVersion: number, newVersion: number) => any,
  onDowngrade: (oldVersion: number, newVersion: number) => any
}

class Database {
  options: DatabaseOptions;
  _models: Record<string, Model<any>>;
  Model: typeof Model;

  /**
   * Database constructor.
   *
   * @param {object} [options]
   *   @param {number} [options.version=0] Database version
   *   @param {string} [options.path] Database path
   *   @param {function} [options.onUpgrade] Triggered when the database is upgraded
   *   @param {function} [options.onDowngrade] Triggered when the database is downgraded
   */
  constructor(options?: { path: string } & Partial<DatabaseOptions>) {
    this.options = {
      version: 0,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onUpgrade() {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onDowngrade() {},
      ...options
    };

    this._models = {};

    class _Model extends Model<any> {}

    this.Model = _Model;

    _Model.prototype._database = this;
  }

  /**
   * Creates a new model.
   *
   * @param {string} name
   * @param {Schema|object} [schema]
   * @return {Model}
   */
  model<T = any>(name: string, schema?: Schema<T> | Record<string, AddSchemaTypeOptions>): Model<any> {
    if (this._models[name]) {
      return this._models[name];
    }

    this._models[name] = new this.Model(name, schema);
    const model = this._models[name];
    return model;
  }

  /**
   * Loads database.
   *
   * @param {function} [callback]
   * @return {BluebirdPromise}
   */
  load(callback?: NodeJSLikeCallback<any>): BluebirdPromise<any> {
    const { path, onUpgrade, onDowngrade, version: newVersion } = this.options;

    if (!path) throw new WarehouseError('options.path is required');

    let oldVersion = 0;

    const getMetaCallBack = data => {
      if (data.meta && data.meta.version) {
        oldVersion = data.meta.version;
      }
    };

    // data event arg0 wrap key/value pair.
    const parseStream = createJsonParseStream('models.$*');

    parseStream.once('header', getMetaCallBack);
    parseStream.once('footer', getMetaCallBack);

    parseStream.on('data', data => {
      this.model(data.key)._import(data.value);
    });

    const rs = createReadStream(path, 'utf8');

    return pipelineAsync(rs, parseStream).then(() => {
      if (newVersion > oldVersion) {
        return onUpgrade(oldVersion, newVersion);
      } else if (newVersion < oldVersion) {
        return onDowngrade(oldVersion, newVersion);
      }
    }).asCallback(callback);
  }

  /**
   * Saves database.
   *
   * @param {function} [callback]
   * @return {BluebirdPromise}
   */
  save(callback?: NodeJSLikeCallback<any>): BluebirdPromise<void> {
    const { path } = this.options;

    if (!path) throw new WarehouseError('options.path is required');
    return BluebirdPromise.resolve(exportAsync(this, path)).asCallback(callback);
  }

  toJSON(): { meta: { version: number, warehouse: string }, models: Record<string, Model<any>> } {
    const models = Object.keys(this._models)
      .reduce((obj, key) => {
        const value = this._models[key];
        if (value != null) obj[key] = value;
        return obj;
      }, {});

    return {
      meta: {
        version: this.options.version,
        warehouse: pkg.version
      }, models
    };
  }
  static Schema = Schema;
  Schema: typeof Schema;
  static SchemaType = SchemaType;
  SchemaType: typeof SchemaType;
  static version: number;
}

Database.prototype.Schema = Schema;
Database.prototype.SchemaType = SchemaType;
Database.version = pkg.version;

export default Database;
