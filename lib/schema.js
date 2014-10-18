'use strict';

var SchemaType = require('./schematype'),
  Types = require('./types'),
  WarehouseError = require('./error'),
  util = require('./util');

var builtinTypes = {
  String: true,
  Number: true,
  Boolean: true,
  Array: true,
  Object: true,
  Date: true
};

function Schema(schema){
  this.paths = {};

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

  this.stacks = {
    getter: [],
    setter: [],
    query: {},
    update: {}
  };

  if (schema){
    this.add(schema);
  }
}

Schema.prototype.add = function(schema, prefix_){
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
  var Type = options.type,
    typeName = Type.name;

  if (builtinTypes[typeName]){
    return new Types[typeName](name, options);
  } else {
    return new Type(name, options);
  }
}

Schema.prototype._schemaType = function(name, obj){
  switch (typeof obj){
    case 'function':
      return getSchemaType(name, {type: obj});

    case 'object':
      if (typeof obj.type === 'function'){
        return getSchemaType(name, obj);
      } else if (Array.isArray(obj)){
        return new Types.Array({
          child: obj.length ? getSchemaType(name, obj[0]) : new SchemaType()
        });
      } else {
        if (Object.keys(obj).length){
          this.add(obj, name + '.');
        }

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
  this._updateStack(name, type);
};

Schema.prototype._updateStack = function(name, type){
  this.stacks.getter.push(function(data){
    var value = util.getProp(data, name),
      result = type.cast(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      util.setProp(data, name, result);
    } else if (value !== undefined){
      util.delProp(data, name);
    }
  });

  this.stacks.setter.push(function(data){
    var value = util.getProp(data, name),
      result = type.validate(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      util.setProp(data, name, result);
    } else if (value !== undefined){
      util.delProp(data, name);
    }
  });
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
}

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
  var stack = this.stacks.getter,
    err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) return err;
  }
};

Schema.prototype._applySetters = function(data){
  var stack = this.stacks.setter,
    err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) return err;
  }
};

function updateStackNormal(key, update){
  return function(data){
    util.setProp(data, key, update);
  };
}

function updateStackOperator(path_, ukey, key, update){
  var path = path_ || new SchemaType(key);

  return function(data){
    var result = path[ukey](util.getProp(data, key), update, data);
    if (result instanceof Error) return result;

    util.setProp(data, key, result);
  };
}

Schema.prototype._parseUpdate = function(updates, prefix_){
  var stackKey = JSON.stringify(updates),
    stack = this.stacks.update[updates];

  if (stack){
    return stack;
  } else {
    stack = [];
  }

  var prefix = prefix_ || '',
    paths = this.paths,
    keys = Object.keys(updates),
    key, update, ukey, name, path, fields, field, j, fieldLen, prefixNoDot;

  if (prefix){
    prefixNoDot = prefix.substring(0, prefix.length - 1);
    path = paths[prefixNoDot];
  }

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    update = updates[key];
    name = prefix + key;

    if (key[0] === '$'){
      ukey = 'u' + key;

      if (prefix){
        stack.push(updateStackOperator(path, ukey, prefixNoDot, update));
      } else {
        fields = Object.keys(update);
        fieldLen = fields.length;

        for (j = 0; j < fieldLen; j++){
          field = fields[i];
          stack.push(updateStackOperator(paths[field], ukey, field, update[field]));
        }
      }
    } else if (update.constructor === Object){
      stack = stack.concat(this._parseUpdate(update, name + '.'));
    } else {
      stack.push(updateStackNormal(name, update));
    }
  }

  this.stacks.update[stackKey] = stack;
  return stack;
};

function queryStackNormal(path_, key, query){
  var path = path_ || new SchemaType(key);

  return function(data){
    return path.match(util.getProp(data, key), query, data);
  };
}

function queryStackOperator(path_, qkey, key, query){
  var path = path_ || new SchemaType(key);

  return function(data){
    return path[qkey](util.getProp(data, key), query, data);
  };
}

function execQueryStack(stack){
  var len = stack.length,
    i;

  return function(data){
    for (i = 0; i < len; i++){
      if (!stack[i](data)) return false;
    }

    return true;
  };
}

function $or(stack){
  var len = stack.length,
    i;

  return function(data){
    for (i = 0; i < len; i++){
      if (stack[i](data)) return true;
    }

    return false;
  };
}

function $nor(stack){
  var len = stack.length,
    i;

  return function(data){
    for (i = 0; i < len; i++){
      if (stack[i](data)) return false;
    }

    return true;
  };
}

function $where(fn){
  return function(data){
    return fn.call(data);
  };
}

Schema.prototype._parseQueryArray = function(arr, prefix){
  var stack = [];

  for (var i = 0, len = arr.length; i < len; i++){
    stack.push(execQueryStack(this._parseQuery(arr[i], prefix)));
  }

  return stack;
};

Schema.prototype._parseQuery = function(queries, prefix_){
  var stackKey = JSON.stringify(queries),
    stack = this.stacks.query[stackKey];

  if (stack){
    return stack;
  } else {
    stack = [];
  }

  var prefix = prefix_ || '',
    paths = this.paths,
    keys = Object.keys(queries),
    key, query, name, path;

  if (prefix){
    path = paths[prefix.substring(0, prefix.length - 1)];
  }

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    query = queries[key];
    name = prefix + key;

    switch (key){
      case '$and':
        stack = stack.concat(this._parseQuery(query, prefix));
        break;

      case '$or':
        stack.push($or(this._parseQueryArray(query, prefix)));
        break;

      case '$nor':
        stack.push($nor(this._parseQueryArray(query, prefix)));
        break;

      case '$where':
        stack.push($where(query));
        break;

      default:
        if (key[0] === '$'){
          stack.push(queryStackOperator(path, 'q' + key, name, query));
        } else if (query.constructor === Object){
          stack = stack.concat(this._parseQuery(query, name + '.'));
        } else {
          stack.push(queryStackNormal(paths[name], name, query));
        }
    }
  }

  this.stacks.query[queries] = stack;
  return stack;
};

Schema.Types = Schema.prototype.Types = Types;

module.exports = Schema;