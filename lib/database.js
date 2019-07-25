'use strict';

const JSONStream = require('JSONStream');
const Promise = require('bluebird');
const fs = require('graceful-fs');
const Model = require('./model');
const Schema = require('./schema');
const SchemaType = require('./schematype');
const util = require('./util');
const WarehouseError = require('./error');
const pkg = require('../package.json');
const JsonReadable = require('json-stream-stringify');

/**
 * Database constructor.
 *
 * @class
 * @param {object} [options]
 *   @param {number} [options.version=0] Database version
 *   @param {string} [options.path] Database path
 *   @param {function} [options.onUpgrade] Triggered when the database is upgraded
 *   @param {function} [options.onDowngrade] Triggered when the database is downgraded
 */
function Database(options) {
  this.options = Object.assign({
    version: 0,
    onUpgrade() {},

    onDowngrade() {}
  }, options);

  this._models = {};

  const _Model = this.Model = function(name, schema) {
    Model.call(this, name, schema);
  };

  util.inherits(_Model, Model);
  _Model.prototype._database = this;
}

/**
 * Creates a new model.
 *
 * @param {string} name
 * @param {Schema|object} [schema]
 * @return {Model}
 */
Database.prototype.model = function(name, schema) {
  if (this._models[name]) {
    return this._models[name];
  }

  const model = this._models[name] = new this.Model(name, schema);
  return model;
};

/**
 * Loads database.
 *
 * @param {function} [callback]
 * @return {Promise}
 */
Database.prototype.load = function(callback) {
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
};

/**
 * Saves database.
 *
 * @param {function} [callback]
 * @return {Promise}
 */
Database.prototype.save = function(callback) {
  const { path } = this.options;

  if (!path) throw new WarehouseError('options.path is required');

  const rs = new JsonReadable(this);

  const ws = fs.createWriteStream(path);

  return new Promise((resolve, reject) => {
    rs.once('error', reject).pipe(ws).once('error', reject).once('finish', resolve);
  }).asCallback(callback);
};

Database.prototype.toJSON = function() {
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
};

Database.Schema = Database.prototype.Schema = Schema;
Database.SchemaType = Database.prototype.SchemaType = SchemaType;
Database.version = pkg.version;

module.exports = Database;
