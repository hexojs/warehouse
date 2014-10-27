'use strict';

var fast = require('fast.js'),
  EventEmitter = require('events').EventEmitter,
  Model = require('./model'),
  Schema = require('./schema'),
  SchemaType = require('./schematype'),
  util = require('./util');

/**
 * Database constructor.
 *
 * @class Database
 * @param {Object} [options]
 *   @param {Number} [options.version=0] Database version
 *   @param {String} [options.path] Database path
 * @constructor
 * @extends {EventEmitter}
 * @module warehouse
 */
function Database(options){
  EventEmitter.call(this);

  /**
   * Database options.
   *
   * @property {Object} options
   * @private
   */
  this.options = fast.assign({
    version: 0,
    path: 'memory'
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

util.inherits(Database, EventEmitter);

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

module.exports = Database;