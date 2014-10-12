'use strict';

var _ = require('lodash'),
  fast = require('fast.js'),
  SchemaType = require('./schematype'),
  Types = require('./types'),
  util = require('./util'),
  WarehouseError = require('./error');

var builtinTypes = util.arr2obj([
  'String', 'Number', 'Boolean', 'Array', 'Object', 'Date'
], true);

var defaultTypes = {
  String: new Types.String(),
  Number: new Types.Number(),
  Boolean: new Types.Boolean(),
  Array: new Types.Array(),
  Object: new Types.Object(),
  Date: new Types.Date(),
  Mixed: new SchemaType()
};

function Schema(schema){
  this.paths = {};

  this.pathKeys = [];

  this.nested = {};

  this.statics = {};

  this.methods = {};

  this.pres = {
    save: [],
    remove: []
  };

  this.posts = {
    save: [],
    remove: []
  };

  if (schema){
    this.add(schema);
  }
};

Schema.prototype.add = function(schema, prefix_){
  // prefix = prefix || '';

  var prefix = prefix_ || '',
    keys = Object.keys(schema),
    len = keys.length,
    key, value;

  if (!len) return;

  for (var i = 0; i < len; i++){
    key = keys[i];
    value = schema[key];

    this.path(prefix + key, value);
  }
};

function getSchemaType(name, options){
  var type = options.type,
    typeName = type.name;

  if (builtinTypes[typeName]){
    return new Types[typeName](name, options);
  } else {
    return new type(name, options);
  }
};

Schema.prototype._schemaType = function(name, obj){
  if (typeof obj === 'function'){
    return getSchemaType(name, {type: obj});
  } else if (typeof obj === 'object'){
    if (typeof obj.type === 'function'){
      return getSchemaType(name, obj);
    } else if (Array.isArray(obj)){
      return new Types.Array({
        child: obj.length ? getSchemaType(name, obj[0]) : new Types.Mixed()
      })
    } else {
      if (Object.keys(obj)){
        this.nested[name] = true;
        this.add(obj, name + '.');
      }
      // this.add(obj, name + '.');
      return new Types.Object();
    }
  }
};

Schema.prototype.path = function(name, obj){
  if (obj == null){
    return this.paths[name];
  }

  var type = obj instanceof SchemaType ? obj : this._schemaType(name, obj);

  if (type == null){
    throw new TypeError('Invalid value for schema path `' + name + '`');
  }

  this.paths[name] = type;

  if (!util.contains(this.pathKeys, name)){
    this.pathKeys.push(name);
  }
};

Schema.prototype.virtual = function(name, fn){
  var virtual = new Types.Virtual(name, {});
  if (fn) virtual.get(fn);

  this.path(name, virtual);

  return virtual;
};

function checkHookType(type){
  if (type !== 'save' && type !== 'remove'){
    throw new TypeError('The type of hook must be `save` or `remove`!');
  }
};

Schema.prototype.pre = function(type, fn){
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');
  checkHookType(type);

  this.pres[type].push(fn);
};

Schema.prototype.post = function(type, fn){
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');
  checkHookType(type);

  this.posts[type].push(fn);
};

Schema.prototype.method = function(name, fn){
  if (typeof fn !== 'function') throw new TypeError('Instance method must be a function!');
  this.methods[name] = fn;
};

Schema.prototype.static = function(name, fn){
  if (typeof fn !== 'function') throw new TypeError('Static method must be a function!');
  this.statics[name] = fn;
};

Schema.prototype._applyGetters = function(data){
  var paths = this.paths,
    keys = this.pathKeys,
    name, path, value, cast;

  for (var i = 0, len = keys.length; i < len; i++){
    name = keys[i];
    path = paths[name];
    value = util.getProp(data, name);
    cast = path.cast(value, data);

    if (cast != null){
      util.setProp(data, name, cast);
    } else if (value != null){
      util.delProp(data, name);
    }
  }

  return data;
};

Schema.prototype._applySetters = function(data){
  var paths = this.paths,
    keys = this.pathKeys,
    name, path, value, result;

  for (var i = 0, len = keys.length; i < len; i++){
    name = keys[i];
    path = paths[name];
    value = util.getProp(data, name);
    result = path.validate(value, data);

    if (result instanceof Error){
      return result;
    } else if (result != null){
      util.setProp(data, name, result);
    } else if (value != null){
      util.delProp(data, name);
    }
  }

  return data;
};

Schema.prototype._parseDatabase = function(data){
  //
};

Schema.prototype._saveDatabase = function(data){
  //
};

Schema.prototype._parseQuery = function(query){
  //
};

Schema.prototype._parseUpdate = function(value, updates, data_, prefix_){
  var data = data_ || value,
    prefix = prefix_ || '',
    paths = this.paths,
    keys = Object.keys(updates),
    path = paths[prefix.substring(0, prefix.length - 1)] || defaultTypes.Mixed,
    key, update, result, fields, field, j, fieldLen, ukey;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    update = updates[key];

    if (key[0] === '$'){
      ukey = 'u' + key;

      // If update operators are used in the first class
      if (!prefix){
        fields = Object.keys(update);

        for (j = 0, fieldLen = fields.length; j < fieldLen; j++){
          field = fields[i];
          path = paths[field] || defaultTypes.Mixed;
          util.setProp(value, field, path[ukey](value[field], update[field], data));
        }
      } else { // Inline update operators
        value = path[ukey](value, update, data);
      }
    } else if (update.constructor === Object){ // Literal object
      result = this._parseUpdate(value[key], update, data, prefix + key + '.');

      if (result instanceof Error){
        return result;
      } else {
        value[key] = result;
      }
    } else {
      value[key] = update;
    }
  }

  return value;
};

Schema.Types = Schema.prototype.Types = Types;

module.exports = Schema;