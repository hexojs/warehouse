'use strict';

var Promise = require('bluebird'),
  fast = require('fast.js'),
  _ = require('lodash'),
  EventEmitter = require('events').EventEmitter,
  Model = require('./model'),
  Schema = require('./schema'),
  SchemaType = require('./schematype'),
  util = require('./util');

function Database(options){
  EventEmitter.call(this);

  this.options = fast.assign({
    version: 0,
    path: 'memory'
  }, options);

  this._models = {};

  var _Model = this.Model = function(name, schema){
    Model.call(this, name, schema);
  };

  util.inherits(_Model, Model);
  _Model.prototype._database = this;
}

util.inherits(Database, EventEmitter);

Database.prototype.model = function(name, schema){
  if (this._models[name]){
    return this._models[name];
  }

  var model = this._models[name] = new this.Model(name, schema);
  return model;
};

Database.Schema = Database.prototype.Schema = Schema;
Database.SchemaType = Database.prototype.SchemaType = SchemaType;

module.exports = Database;