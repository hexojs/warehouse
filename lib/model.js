var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  _ = require('underscore'),
  Schema = require('./schema'),
  random = Math.random;

var Model = module.exports = function Model(name, parent, schema, index, fields){
  this._name = name;
  this._parent = parent;
  this._store = parent._store[name];
  this._index = index;
  this._fields = fields;

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

util.inherits(Model, EventEmitter);

Model.prototype.forEach = Model.prototype.each = function(iterator){
  var index = this._index;
  for (var i=0, len=index.length; i<len; i++){
    var item = index[i];
    iterator.call(this, this._getOne(item), item);
  }
  return this;
};

Model.prototype.toArray = function(){
  var arr = [];
  this.each(function(item){
    arr.push(item);
  });
  return arr;
};

Model.prototype.count = function(){
  return this._index.length;
};

Model.prototype._getOne = function(id){
  id = parseInt(id, 10);
  var index = this._index,
    pos = index.indexOf(id);

  if (pos === -1) return undefined;

  var obj = this._store.get(id),
    data = this._schema.restore(obj),
    fields = this._fields;
  data._id = id;
  if (fields){
    return _.pick(data, fields);
  } else {
    return data;
  }
};

Model.prototype.get = function(){
  var args = _.toArray(arguments);

  var arr = _.uniq(_.flatten(args));
  if (arr.length > 1){
    var results = [];
    for (var i=0, len=arr.length; i<len; i++){
      var data = this._getOne(arr[i]);
      if (data != null && typeof data !== 'undefined') results.push(data);
    }
    return results;
  } else {
    return this._getOne(arr[0]);
  }
};

Model.prototype._insertOne = function(data, callback){
  var store = this._store,
    id = store.get('_primary');
  store.set(id, this._schema.save(data));
  store.set('_primary', id + 1);
  this._index.push(id);
  var item = this._getOne(id);
  this.emit('insert', item, id);
  callback.call(this, item, id);
};

Model.prototype.insert = function(data, callback){
  if (!_.isFunction(callback)) callback = function(){};

  if (_.isArray(data)){
    var arr = [];
    for (var i=0, len=data.length; i<len; i++){
      this._insertOne(data[i], function(item){
        arr.push(item);
      });
    }
    callback.call(this, arr);
  } else {
    this._insertOne(data, callback);
  }
  return this;
};

Model.prototype._updateOne = function(id, data){
  id = parseInt(id, 10);
  var obj = this._getOne(id);

  for (var i in data){
    var val = data[i];
    if (_.isObject(val)){
      var target = obj[i];
      if (_.isArray(target)){
        for (var j in val){
          var prop = val[j];
          switch (j){
            case '$push':
              if (_.isArray(prop)){
                obj[i] = target.concat(prop);
              } else {
                obj[i].push(prop);
              }
              break;

            case '$pull':
              obj[i] = _.without(target, prop);
              break;

            case '$shift':
              if (prop > 0){
                item[i].slice(prop);
              } else if (prop < 0){
                item[i].slice(0, target.length + prop);
              }
              break;

            case '$pop':
              if (prop > 0){
                item[i].slice(0, target.length - prop);
              } else if (prop < 0){
                item.slice(-prop);
              }
              break;
          }
        }
      } else if (_.isNumber(target)){
        for (var j in val){
          var prop = val[j];
          switch (j){
            case '$inc':
              obj[i] += prop;
              break;

            case '$dec':
              obj[i] -= prop;
              break;
          }
        }
      } else {
        obj[i] = val;
      }
    }
    obj[i] = val;
  }

  this._store.set(id, this._schema.save(obj));
  this.emit('update', this._getOne(id), id);
};

Model.prototype.update = function(id, data){
  if (_.isObject(id)){
    for (var i in id){
      this._updateOne(i, id);
    }
  } else {
    this._updateOne(id, data);
  }
  return this;
};

Model.prototype._removeOne = function(id){
  this._store.remove(id);
};

Model.prototype.remove = function(id){
  if (typeof id === 'undefined'){
    var index = this._index;
    for (var i=0, len=this.length; i<len; i++){
      this._removeOne(index[i]);
    }
  } else if (_.isArray(id)){
    for (var i=0, len=id.length; i<len; i++){
      this._removeOne(id[i]);
    }
  } else {
    this._removeOne(id);
  }

  return this;
};

Model.prototype.destroy = function(){
  delete this._parent.store[this._name];
  return this;
};

Model.prototype.first = function(){
  return this._getOne(this._index[0]);
};

Model.prototype.last = function(){
  return this._getOne(this._index[this.length - 1]);
};

Model.prototype.find = function(query, options){

};

Model.prototype.findOne = function(query, options){
  return this.find(query, options).first();
};

Model.prototype.select = function(fields){
  return new Model(this._name, this._parent, this._schema, this._index, this._fields);
};

Model.prototype.slice = function(start, end){
  return new Model(this._name, this._parent, this._schema, [].slice.apply(this._index, arguments), this._fields);
};

Model.prototype.skip = function(i){
  return this.slice(i);
};

Model.prototype.limit = function(i){
  return this.slice(0, i);
};

Model.prototype.reverse = function(){
  return new Model(this._name, this._parent, this._schema, this._index.reverse(), this._fields);
};

Model.prototype.random = Model.prototype.shuffle = function(){
  var arr = this._index.sort(function(a, b){
    return random() - 0.5 < 0;
  });
  return new Model(this._name, this._parent, this._schema, arr, this._fields);
};

Model.prototype.sort = function(orderby, order){
  var index = this._index,
    _this = this;

  var arr = index.sort(function(a, b){
    var orderA = _this._getOne(a)[orderby],
      orderB = _this._getOne(b)[orderby];

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
    if (order == -1 || order.toLowerCase() === 'desc') arr = arr.reverse();
  }

  return new Model(this._name, this._parent, this._schema, arr, this._fields);
};