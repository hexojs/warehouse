'use strict';

const JSONStream = require('JSONStream');
const Promise = require('bluebird');
const fs = require('graceful-fs');
const Model = require('./model');
const Schema = require('./schema');
const SchemaType = require('./schematype');
const WarehouseError = require('./error');
const pkg = require('../package.json');

class Database {

  /**
   * Database constructor.
   *
   * @param {object} [options]
   *   @param {number} [options.version=0] Database version
   *   @param {string} [options.path] Database path
   *   @param {function} [options.onUpgrade] Triggered when the database is upgraded
   *   @param {function} [options.onDowngrade] Triggered when the database is downgraded
   */
  constructor(options) {
    this.options = Object.assign({
      version: 0,
      onUpgrade() {},

      onDowngrade() {}
    }, options);

    this._models = {};

    class _Model extends Model {}

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
  model(name, schema) {
    if (this._models[name]) {
      return this._models[name];
    }

    const model = this._models[name] = new this.Model(name, schema);
    return model;
  }

  /**
   * Loads database.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  load(callback) {
    const path = this.options.path;

    if (!path) throw new WarehouseError('options.path is required');

    return new Promise((resolve, reject) => {
      const src = fs.createReadStream(path, {encoding: 'utf8'});
      let oldVersion = 0;

      const stream = JSONStream.parse([true, true], (value, keys) => {
        switch (keys.shift()) {
          case 'meta':
            if (keys.shift() === 'version') {
              oldVersion = value;
            }

            break;

          case 'models':
            this.model(keys.shift())._import(value);
            break;
        }
      });

      src
        .pipe(stream)
        .on('error', reject)
        .on('end', () => {
          resolve(oldVersion);
        });
    }).then(oldVersion => {
      const newVersion = this.options.version;

      if (newVersion > oldVersion) {
        return this.options.onUpgrade(oldVersion, newVersion);
      } else if (newVersion < oldVersion) {
        return this.options.onDowngrade(oldVersion, newVersion);
      }
    }).asCallback(callback);
  }

  /**
   * Saves database.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  save(callback) {
    const { path } = this.options;

    if (!path) throw new WarehouseError('options.path is required');

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(path);

      // Start
      stream.write('{');

      // Meta
      stream.write(`"meta":${JSON.stringify({
        version: this.options.version,
        warehouse: pkg.version
      })},`);

      // Export models

      stream.write('"models":{');

      const models = this._models;
      const keys = Object.keys(models);
      const { length } = keys;

      for (let i = 0; i < length; i++) {
        const key = keys[i];
        const model = models[key];

        if (!model) continue;

        if (i) stream.write(',');
        stream.write(`"${key}":${model._export()}`);
      }

      stream.write('}');

      // End
      stream.end('}');

      stream.on('error', reject)
        .on('finish', resolve);
    }).asCallback(callback);
  }

  toJSON() {
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
}

Database.Schema = Database.prototype.Schema = Schema;
Database.SchemaType = Database.prototype.SchemaType = SchemaType;
Database.version = pkg.version;

module.exports = Database;
