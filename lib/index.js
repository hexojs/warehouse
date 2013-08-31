/**
 * Module dependencies.
 */

var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  Model = require('./model'),
  Schema = require('./schema'),
  SchemaType = require('./schematype'),
  Store = require('./store'),
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
  this._store = new Store();
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
  if (!callback){
    if (typeof src === 'function'){
      callback = src;
      src = this._source;
    } else {
      callback = function(){};
    }
  }

  var self = this;

  if (src){
    this._source = src;

    fs.readFile(src, function(err, content){
      if (err) return callback(err);

      try {
        self._restore(JSON.parse(content));

        var models = self._models,
          keys = Object.keys(models);

        for (var i = 0, len = keys.length; i < len; i++){
          models[keys[i]]._updateIndex();
        }

        callback();
      } catch (err){
        callback(err);
      }
    });
  } else {
    callback(new Error('Source is not defined'));
  }

  return this;
};

Database.prototype._restore = function(json){
  var self = this;

  _.each(json, function(obj, name){
    var store = new Store();

    _.each(obj, function(item, i){
      store.set(i, _.extend({_id: i}, item));
    });

    self._store.set(name, store);
  });
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
  if (!callback){
    if (typeof dest === 'function'){
      callback = dest;
      dest = this._source;
    } else {
      callback = function(){};
    }
  }

  if (dest){
    var list = this._store.list(),
      arr = [];

    for (var i in list){
      arr.push(list[i]);
    }

    fs.writeFile(dest, JSON.stringify(arr), callback);
  } else {
    callback(new Error('Destination is not defined'));
  }

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

  if (!this._store.get(name)) this._store.set(name, new Store());

  var model = new Model(name, schema, this);

  return this._models[name] = model;
};

/**
 * Checks if the model exists.
 *
 * @param {String} name
 * @return {Boolean}
 * @api private
 */

Database.prototype._hasModel = function(name){
  return this._models.hasOwnProperty(name);
};

/**
 * Expose prototype.
 */

Database.Model = Database.prototype.Model = Model;
Database.Schema = Database.prototype.Schema = Schema;
Database.SchemaType = Database.prototype.SchemaType = SchemaType;
Database.util = Database.prototype.util = util;