var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  Model = require('./model'),
  Schema = require('./schema'),
  Store = require('./store');

if (!fs.exists || !fs.existsSync){
  fs.exists = path.exists;
  fs.existsSync = path.existsSync;
}

var Database = module.exports = function Database(source){
  this._store = new Store();
  if (source){
    this.load(source);
  }
};

Database.prototype.load = function(source, callback){
  if (_.isObject(source)){
    if (_.isFunction(callback)) callback();
  } else {
    var _this = this;
    this._source = source;
    if (_.isFunction(callback)){
      fs.exists(source, function(exist){
        if (!exist) return callback();
        fs.readFile(source, 'utf8', function(err, content){
          if (err) throw new Error('Database load error');
          try {
            content = JSON.parse(content);
            for (var i in content){
              this._store.set(i, new Store(content[i]));
            }
            callback();
          } catch (e){
            callback(e);
          }
        });
      });
    } else {
      var exist = fs.existsSync(source);
      if (exist){
        var content = JSON.parse(fs.readFileSync(source, 'utf8'));
        for (var i in content){
          this._store.set(i, new Store(content[i]));
        }
      }
    }
  }
};

Database.prototype.save = function(source, callback){
  if (!_.isFunction(callback)){
    if (_.isFunction(source)){
      callback = source;
      source = this._source;
    } else if (!source){
      source = this._source;
    }
  }

  var result = {},
    store = this._store.list();

  for (var i in store){
    result[i] = store[i].list();
  }

  if (_.isFunction(callback)){
    fs.writeFile(source, JSON.stringify(result), callback);
  } else {
    fs.writeFileSync(source, JSON.stringify(result));
  }
};

Database.prototype.model = function(name, schema){
  var store = this._store,
    data = store.get(name);

  if (data){
    var index = _.without(Object.keys(data.list()), '_primary');
  } else {
    var index = [];
    store.set(name, new Store({_primary: 1}));
  }

  return new Model(name, this, schema, index);
};

Database.prototype.Model = Model;
Database.prototype.Schema = Schema;
Database.prototype.Store = Store;
Database.prototype.util = require('./util');