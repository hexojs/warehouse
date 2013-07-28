/**
 * Module dependencies.
 */

var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  Model = require('./model'),
  Schema = require('./schema'),
  util = require('./util');

/**
 * Fallback for Node.js 0.8 and below.
 */

if (!fs.exists || !fs.existsSync){
  fs.exists = path.exists;
  fs.existsSync = path.existsSync;
}

/**
 * Creates a new database instance.
 *
 * @param {String} source
 * @api public
 */

var Database = module.exports = function(source){
  this._store = {};
  this._models = {};
  this._modelSchemas = {};

  if (source){
    this.load(source);
  }
};

/**
 * Loads database from the given `src`.
 *
 * @param {String} src
 * @param {Function} [callback]
 * @return {Database}
 * @api public
 */

Database.prototype.load = function(src, callback){
  var self = this;

  this._source = src;

  fs.readFile(src, function(err, content){
    if (err) return callback && callback(err);

    try {
      self._store = JSON.parse(content);
      callback && callback();
    } catch (err){
      callback && callback(err);
    }
  });

  return this;
};

/**
 * Saves database to the given `dest`.
 *
 * @param {String} dest
 * @param {Function} [callback]
 * @return {Database}
 * @api public
 */

Database.prototype.save = function(dest, callback){
  if (typeof callback !== 'function'){
    if (typeof dest === 'function' && this._source){
      callback = dest;
      dest = this._source;
    } else {
      callback(new Error('Destination undefined.'));
    }
  }

  fs.writeFile(dest, JSON.stringify(result), callback);

  return this;
};

/**
 * Creates/Returns a model.
 *
 * @param {String} name
 * @param {Schema|Object} [schema]
 * @return {Model}
 * @api public
 */

Database.prototype.model = function(name, schema){
  if (typeof schema === 'undefined'){
    if (this._modelSchemas.hasOwnProperty(name)){
      var schema = this._modelSchemas[name];
    } else {
      var schema = new Schema({});
    }
  } else {
    if (!(schema instanceof Schema)) schema = new Schema(schema);
    this._modelSchemas[name] = schema;
  }

  var model = new Model(name, schema, this);

  return this._models[name] = model;
};

/**
 * Expose prototype.
 */

Database.Model = Database.prototype.Model = Model;
Database.Schema = Database.prototype.Schema = Schema;
Database.util = Database.prototype.util = util;