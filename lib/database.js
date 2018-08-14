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
  const self = this;

  if (!path) throw new WarehouseError('options.path is required');

  return new Promise((resolve, reject) => {
    const src = fs.createReadStream(path, {encoding: 'utf8'});
    let oldVersion = 0;

    const stream = JSONStream.parse([true, true], (value, keys) => {
      switch (keys.shift()){
        case 'meta':
          if (keys.shift() === 'version') {
            oldVersion = value;
          }

          break;

        case 'models':
          self.model(keys.shift())._import(value);
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
    const newVersion = self.options.version;

    if (newVersion > oldVersion) {
      return self.options.onUpgrade(oldVersion, newVersion);
    } else if (newVersion < oldVersion) {
      return self.options.onDowngrade(oldVersion, newVersion);
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
  const path = this.options.path;
  const self = this;

  if (!path) throw new WarehouseError('options.path is required');

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(path);

    // Start
    stream.write('{');

    // Meta
    stream.write(`"meta":${JSON.stringify({
      version: self.options.version,
      warehouse: pkg.version
    })},`);

    // Export models
    const models = self._models;
    const keys = Object.keys(models);
    let model, key;

    stream.write('"models":{');

    for (let i = 0, len = keys.length; i < len; i++) {
      key = keys[i];
      model = models[key];

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
};

Database.Schema = Database.prototype.Schema = Schema;
Database.SchemaType = Database.prototype.SchemaType = SchemaType;
Database.version = pkg.version;

module.exports = Database;
