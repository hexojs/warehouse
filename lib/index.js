var _ = require('underscore'),
  fs = require('fs'),
  Model = require('./model'),
  Schema = require('./schema'),
  Store = require('./store');

var Database = module.exports = function Database(source){
  this._store = new Store();
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
    fs.exists(source, function(exist){
      if (!exist) return callback();
      fs.readFile(source, 'utf8', function(err, content){
        if (err) throw new Error('Database load error');
        this._store = new Store(JSON.parse(content));
        callback();
      });
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
  var store = this._store,
    data = store.get(name);

  if (data){
    var index = _.without(Object.keys(store.list()), '_primary');
  } else {
    var index = [];
    store.set(name, new Store({_primary: 1}));
  }

  return new Model(name, this, schema, index);
};

Database.prototype.Model = Model;
Database.prototype.Schema = Schema;
Database.prototype.Store = Store;