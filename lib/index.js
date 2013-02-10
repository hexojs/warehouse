var _ = require('underscore'),
  fs = require('fs'),
  Model = require('./model'),
  Schema = require('./schema'),
  Store = require('./store');

var Database = module.exports = function(source){
  this._store = {};
  if (source){
    this.load(source);
  }
};

Database.prototype.load = function(source, callback){
  if (!_.isFunction(callback)) callback = function(){};
  if (_.isObject(source)){
    this._store = source;
    callback();
  } else {
    this._source = source;
    fs.readFile(source, 'utf8', function(err, content){
      if (err) throw new Error('Database load error');
      var data = JSON.parse(content);
      for (var i in data){
        this._store[i] = new Store(data[i]);
      }
      callback();
    });
  }
};

Database.prototype.save = function(source, callback){
  if (typeof callback === 'undefined'){
    if (_.isFunction(source)){
      callback = source;
      source = this._source;
    } else {
      callback = function(){};
    }
  }

  var result = {},
    store = this._store;

  for (var i in store){
    result[i] = store[i].list();
  }

  fs.writeFile(source, JSON.stringify(result), callback);
};

Database.prototype.model = function(name, schema){
  if (this._store.hasOwnProperty(name)){
    var store = this._store[name],
      index = _.without(Object.keys(store.list()), '_primary');
  } else {
    var store = this._store[name] = new Store(),
      index = [];
    store.set('_primary', 1);
  }
  return new Model(name, this, schema, index, null);
};

Database.prototype.Model = Model;
Database.prototype.Schema = Schema;
Database.prototype.Store = Store;