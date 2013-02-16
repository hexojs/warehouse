var EventEmitter = require('events').EventEmitter,
  _ = require('lodash'),
  util = require('./util'),
  Schema = require('./schema');

var Model = module.exports = function Model(name, parent, schema, index){
  this._name = name;
  this._parent = parent;
  this._store = parent._store.get(name);

  for (var i=0, len=index.length; i<len; i++){
    var id = index[i];
    index[i] = isNaN(+id) ? id : +id;
  }

  this._index = index;

  if (schema.constructor === Schema){
    this._schema = schema;

    var methods = schema.methods,
      _this = this;

    for (var i in methods){
      this.__proto__[i] = function(){
        return methods[i].call(_this);
      };
    }
  } else {
    this._schema = new Schema(schema);
  }

  this.__defineGetter__('length', function(){
    return this._index.length;
  });
};

require('util').inherits(Model, EventEmitter);

Model.prototype._init = function(index){
  return new Model(this._name, this._parent, this._schema, index);
};

Model.prototype._getRaw = function(id){
  return this._store.get(id);
};

Model.prototype._getOne = function(id){
  var data = this._getRaw(id);
  if (data){
    data._id = isNaN(+id) ? id : +id;
    return data;
  }
};

Model.prototype.get = function(){
  var args = util.unique(util.flatten(_.toArray(arguments)));

  if (args.length > 1){
    var results = [];
    for (var i=0, len=args.length; i<len; i++){
      results.push(this._getOne(args[i]));
    }
    return results;
  } else {
    return this._getOne(args[0]);
  }
};

Model.prototype.forEach = Model.prototype.each = function(iterator){
  var index = this._index;
  for (var i=0, len=index.length; i<len; i++){
    var id = index[i];
    iterator(this._getOne(id), id);
  }
  return this;
};

Model.prototype.toArray = function(){
  var results = [];
  this.each(function(item){
    results.push(item);
  });
  return results;
};

Model.prototype.count = function(){
  return this._index.length;
};

Model.prototype._insertOne = function(id, obj, callback){
  var data = this._schema.save(obj);
  id = isNaN(+id) ? id : +id;
  this._store.set(id, data);
  var item = this._getOne(id);
  this.emit('insert', item, id);
  callback(item, id);
};

Model.prototype.insert = function(data, callback){
  if (!_.isFunction(callback)) callback = function(){};

  if (Array.isArray(data)){
    var length = data.length,
      id = this._store.get('_primary'),
      ids = [],
      results = [];
    for (var i=0; i<length; i++){
      this._insertOne(id + i, data[i], function(item){
        results.push(item);
      });
      ids.push(id + i);
    }
    this._index = this._index.concat(ids);
    this._store.set('_primary', id + length);
    callback(results);
  } else {
    var id = this._store.get('_primary'),
      result;
    this._insertOne(id, data, function(item){
      result = item;
    });
    this._index.push(id);
    this._store.set('_primary', id + 1);
    callback(result, id);
  }

  return this;
};

Model.prototype._updateOne = function(id, obj){
  var data = this._getRaw(id);
  id = isNaN(+id) ? id : +id;

  for (var i in obj){
    var target = obj[i],
      origin = data[i];
    if (data.hasOwnProperty(i) && _.isObject(target) && !Array.isArray(target)){
      if (Array.isArray(origin)){
        for (var j in target){
          var prop = target[j];
          switch (j){
            case '$push':
              if (Array.isArray(prop)){
                data[i] = origin.concat(prop);
              } else {
                data[i].push(prop);
              }
              break;
            case '$pull':
              if (Array.isArray(prop)){
                data[i] = _.difference(origin, prop);
              } else {
                data[i] = _.without(origin, prop);
              }
              break;
            case '$shift':
              prop = parseInt(prop, 10);
              if (prop > 0){
                data[i] = origin.slice(prop);
              } else {
                data[i] = origin.slice(0, origin.length + prop);
              }
              break;
            case '$pop':
              prop = parseInt(prop, 10);
              if (prop > 0){
                data[i] = origin.slice(0, origin.length - prop);
              } else {
                data[i] = origin.slice(-prop);
              }
              break;
          }
        }
      } else if (_.isNumber(origin)){
        for (var j in target){
          var prop = target[j];
          switch (j){
            case '$inc':
              data[i] += prop;
              break;
            case '$dec':
              data[i] -= prop;
              break;
          }
        }
      } else {
        data[i] = target;
      }
    } else {
      data[i] = target;
    }
  }

  this._store.set(id, data);
  this.emit('update', data);
};

Model.prototype.update = function(id, data){
  if (_.isObject(id)){
    for (var i in id){
      this._updateOne(i, id[i]);
    }
  } else {
    this._updateOne(id, data);
  }
  return this;
};

Model.prototype._removeOne = function(id){
  id = isNaN(+id) ? id : +id;
  this._store.remove(id);
  this.emit('remove', id);
};

Model.prototype.remove = function(){
  var args = util.unique(util.flatten(_.toArray(arguments))),
    index = this._index;

  if (!args.length){
    for (var i=0, len=index.length; i<len; i++){
      this._removeOne(index[i]);
    }
    this._index = [];
  } else if (args.length > 1){
    for (var i=0, len=args.length; i<len; i++){
      var id = args[i];
      id = args[i] = isNaN(+id) ? id : +id;
      this._removeOne(id);
    }
    this._index = _.difference(index, args);
  } else {
    var id = args[0];
    id = isNaN(+id) ? id : +id;
    this._removeOne(id);
    this._index = _.without(index, id);
  }
  return this;
};

Model.prototype.destroy = function(){
  this._parent._store.remove(this._name);
  return this;
};

Model.prototype.first = function(){
  return this._getOne(this._index[0]);
};

Model.prototype.last = function(){
  var index = this._index;
  return this._getOne(index[index.length - 1]);
};

Model.prototype.slice = function(start, end){
  return this._init([].slice.apply(this._index, arguments));
};

Model.prototype.limit = function(num){
  return this.slice(0, num);
};

Model.prototype.skip = function(num){
  return this.slice(num);
};

Model.prototype.reverse = function(){
  return this._init(util.reverse(this._index));
};

Model.prototype.sort = function(orderby, order){
  var data = {};

  this.each(function(item, id){
    data[id] = item;
  });

  var arr = this._index.sort(function(a, b){
    var orderA = data[a][orderby],
      orderB = data[b][orderby];

    if (orderA < orderB){
      return -1;
    } else if (orderA > orderB){
      return 1;
    } else {
      return 0;
    }
  });

  if (order){
    order = order.toString();
    if (order == -1 || order.toLowerCase() == 'desc') arr = arr.reverse();
  }

  return this._init(arr);
};

Model.prototype.random = Model.prototype.shuffle = function(){
  return this._init(util.shuffle(this._index));
};