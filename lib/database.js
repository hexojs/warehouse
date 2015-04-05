'use strict';

var JSONStream = require('JSONStream');
var Promise = require('bluebird');
var fs = require('graceful-fs');
var Model = require('./model');
var Schema = require('./schema');
var SchemaType = require('./schematype');
var util = require('./util');
var WarehouseError = require('./error');
var pkg = require('../package.json');
var extend = util.extend;

/**
 * Database constructor.
 *
 * @class Database
 * @param {Object} [options]
 *   @param {Number} [options.version=0] Database version
 *   @param {String} [options.path] Database path
 * @constructor
 * @module warehouse
 */
function Database(options){
  /**
   * Database options.
   *
   * @property {Object} options
   * @private
   */
  this.options = extend({
    version: 0,
    onUpgrade: function(){},
    onDowngrade: function(){}
  }, options);

  /**
   * Models.
   *
   * @property {Object} _models
   * @private
   */
  this._models = {};

  /**
   * Model constructor for this database instance.
   *
   * @property {Function} Model
   * @param {String} name
   * @param {Schema|Object} [schema]
   * @constructor
   * @private
   */
  var _Model = this.Model = function(name, schema){
    Model.call(this, name, schema);
  };

  util.inherits(_Model, Model);
  _Model.prototype._database = this;
}

/**
 * Creates a new model.
 *
 * @method model
 * @param {String} name
 * @param {Schema|Object} [schema]
 * @return {Model}
 */
Database.prototype.model = function(name, schema){
  if (this._models[name]){
    return this._models[name];
  }

  var model = this._models[name] = new this.Model(name, schema);
  return model;
};

/**
 * Loads database.
 *
 * @method load
 * @param {Function} [callback]
 * @return {Promise}
 */
Database.prototype.load = function(callback){
  var path = this.options.path;
  var self = this;

  if (!path) throw new WarehouseError('options.path is required');

  return new Promise(function(resolve, reject){
    var src = fs.createReadStream(path, {encoding: 'utf8'});
    var oldVersion = 0;

    var stream = JSONStream.parse([true, true], function(value, keys){
      switch (keys.shift()){
        case 'meta':
          if (keys.shift() === 'version'){
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
      .on('end', function(){
        resolve(oldVersion);
      });
  }).then(function(oldVersion){
    var newVersion = self.options.version;

    if (newVersion > oldVersion){
      return self.options.onUpgrade(oldVersion, newVersion);
    } else if (newVersion < oldVersion){
      return self.options.onDowngrade(oldVersion, newVersion);
    }
  }).nodeify(callback);
};

/**
 * Saves database.
 *
 * @method save
 * @param {Function} callback
 * @return {Promise}
 */
Database.prototype.save = function(callback){
  var path = this.options.path;
  var self = this;

  if (!path) throw new WarehouseError('options.path is required');

  return new Promise(function(resolve, reject){
    var stream = fs.createWriteStream(path);

    // Start
    stream.write('{');

    // Meta
    stream.write('"meta":' + JSON.stringify({
      version: self.options.version,
      warehouse: pkg.version
    }) + ',');

    // Export models
    var models = self._models,
      keys = Object.keys(models),
      model, key;

    stream.write('"models":{');

    for (var i = 0, len = keys.length; i < len; i++){
      key = keys[i];
      model = models[key];

      if (!model) continue;

      if (i) stream.write(',');
      stream.write('"' + key + '":' + model._export());
    }

    stream.write('}');

    // End
    stream.end('}');

    stream.on('error', reject)
      .on('finish', resolve);
  }).nodeify(callback);
};

/**
 * See {% crosslink Schema %}.
 *
 * @property {Schema} Schema
 * @static
 */
Database.Schema = Database.prototype.Schema = Schema;

/**
 * See {% crosslink SchemaType %}.
 *
 * @property {SchemaType} SchemaType
 * @static
 */
Database.SchemaType = Database.prototype.SchemaType = SchemaType;

/**
 * Warehouse version.
 *
 * @property {String} version
 * @static
 */
Database.version = pkg.version;

module.exports = Database;