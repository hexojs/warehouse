/**
* This is the main module of warehouse.
*
* @module warehouse
* @main warehouse
*/

var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  Model = require('./model'),
  Schema = require('./schema'),
  SchemaType = require('./schematype'),
  Store = require('./store'),
  util = require('./util');

if (!fs.exists || !fs.existsSync){
  fs.exists = path.exists;
  fs.existsSync = path.existsSync;
}

/**
* Manages all models and stores data.
*
* @class Database
* @constructor
* @param {String} [source]
* @module warehouse
*/

var Database = module.exports = function(source){
  /**
  * Stores all data.
  *
  * @property _store
  * @type Store
  * @private
  */

  this._store = new Store();

  /**
  * Stores all models.
  *
  * @property _models
  * @type Object
  * @private
  */

  this._models = {};

  /**
  * Stores all schemas of models.
  *
  * @property _modelSchemas
  * @type Object
  * @private
  */

  this._modelSchemas = {};

  if (source){
    this.load(source);
  }
};

/**
* Loads database files.
*
* @method load
* @param {String} src
* @param {Function} [callback]
* @chainable
* @async
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

/**
* Restores data from database files.
*
* @method _restore
* @param {Object} json
* @private
*/

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
* Saves data to JSON files.
*
* @method save
* @param {String} dest
* @param {Function} [callback]
* @chainable
* @async
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
* Creates a model. If the model already exists, returns the existing model.
*
* @method model
* @param {String} name
* @param {Schema|Object} [schema]
* @return {Model}
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
* @method _hasModel
* @param {String} name
* @return {Boolean}
* @private
*/

Database.prototype._hasModel = function(name){
  return this._models.hasOwnProperty(name);
};

/**
* See {% crosslink Model %}
*
* @property Model
* @type Model
* @static
*/

Database.Model = Database.prototype.Model = Model;

/**
* See {% crosslink Schema %}
*
* @property Schema
* @type Schema
* @static
*/

Database.Schema = Database.prototype.Schema = Schema;

/**
* See {% crosslink SchemaType %}
*
* @property SchemaType
* @type SchemaType
* @static
*/

Database.SchemaType = Database.prototype.SchemaType = SchemaType;

/**
* See {% crosslink util %}
*
* @property util
* @type util
* @static
*/

Database.util = Database.prototype.util = util;