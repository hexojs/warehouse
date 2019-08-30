'use strict';

const JSONStream = require('JSONStream');
const Promise = require('bluebird');
const fs = require('graceful-fs');
const Model = require('./model');
const Schema = require('./schema');
const SchemaType = require('./schematype');
const WarehouseError = require('./error');
const pkg = require('../package.json');
const JsonReadable = require('json-stream-stringify');

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
  const { path, onUpgrade, onDowngrade, version: newVersion } = this.options;

  if (!path) throw new WarehouseError('options.path is required');

  let oldVersion = 0;

  const getMetaCallBack = data => {
    if (data.meta && data.meta.version) {
      oldVersion = data.meta.version;
    }
  };

  // data event arg0 wrap key/value pair.
  const parseStream = JSONStream.parse('models.$*');

  parseStream.once('header', getMetaCallBack);
  parseStream.once('footer', getMetaCallBack);

  parseStream.on('data', data => {
    this.model(data.key)._import(data.value);
  });

  const rs = fs.createReadStream(path, 'utf8');

  const promise = new Promise((resolve, reject) => {
    parseStream.once('error', reject);
    parseStream.once('end', resolve);

    rs.once('error', reject);
  }).then(() => {
    if (newVersion > oldVersion) {
      return onUpgrade(oldVersion, newVersion);
    } else if (newVersion < oldVersion) {
      return onDowngrade(oldVersion, newVersion);
    }
  }).asCallback(callback);

  rs.pipe(parseStream);

  return promise;
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
