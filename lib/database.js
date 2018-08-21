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
const ExportStream = require('./ExportStream');

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

  return new Promise((resolve, reject) => {
    const readable = new ExportStream(this);
    const stream = fs.createWriteStream(path, 'utf8');
    readable.once('error', reject).pipe(stream).once('error', reject).once('finish', resolve);
  }).asCallback(callback);
};

Database.Schema = Database.prototype.Schema = Schema;
Database.SchemaType = Database.prototype.SchemaType = SchemaType;
Database.version = pkg.version;

module.exports = Database;
