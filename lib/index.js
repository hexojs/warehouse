var _ = require('underscore'),
  fs = require('fs'),
  Model = require('./model'),
  Schema = require('./schema'),
  Store = require('./store');

var Database = module.exports = function(source){
  this.store = {};
  if (source){
    this.load(source);
  }
};

Database.prototype.load = function(source, callback){
  if (!_.isFunction(callback)) callback = function(){};
  if (_.isObject(source)){
    this.store = source;
    callback();
  } else {
    this._source = source;
    fs.readFile(source, 'utf8', function(err, content){
      if (err) throw new Error('Database load error');
      var data = JSON.parse(content);
      for (var i in data){
        this.store[i] = new Store(data[i]);
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
    store = this.store;

  for (var i in store){
    result[i] = store[i].list();
  }

  fs.writeFile(source, JSON.stringify(result), callback);
};

Database.prototype.model = function(name, schema){
  var store = this.store[name] = this.store[name] || new Store(),
    index = _(store).omit('_primary').keys();
  store.set('_primary', 1);
  return new Model(name, schema, this, index, null);
};

Database.prototype.Model = Model;
Database.prototype.Schema = Schema;
Database.prototype.Store = Store;