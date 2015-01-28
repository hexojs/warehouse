'use strict';

var SchemaType = require('./schematype');
var Types = require('./types');
var Promise = require('bluebird');
var util = require('./util');
var PopulationError = require('./error/population');

var getProp = util.getProp;
var setProp = util.setProp;
var delProp = util.delProp;
var isArray = Array.isArray;

var builtinTypes = {
  String: true,
  Number: true,
  Boolean: true,
  Array: true,
  Object: true,
  Date: true
};

/**
 * Schema constructor.
 *
 * @class Schema
 * @param {Object} schema
 * @constructor
 * @module warehouse
 */
function Schema(schema){
  /**
   * Schema paths.
   *
   * @property {Object} paths
   * @private
   */
  this.paths = {};

  /**
   * Static methods.
   *
   * @property {Object} statics
   * @private
   */
  this.statics = {};

  /**
   * Instance methods.
   *
   * @property {Object} methods
   * @private
   */
  this.methods = {};

  /**
   * Hooks.
   *
   * @property {Object} hooks
   * @private
   */
  this.hooks = {
    pre: {
      save: [],
      remove: []
    },
    post: {
      save: [],
      remove: []
    }
  };

  /**
   * Cache stacks.
   *
   * @property {Object} stacks
   * @private
   */
  this.stacks = {
    getter: [],
    setter: [],
    import: [],
    export: []
  };

  if (schema){
    this.add(schema);
  }
}

/**
 * Adds paths.
 *
 * @method add
 * @param {Object} schema
 * @param {String} prefix_
 */
Schema.prototype.add = function(schema, prefix_){
  var prefix = prefix_ || '';
  var keys = Object.keys(schema);
  var len = keys.length;
  var key, value;

  if (!len) return;

  for (var i = 0; i < len; i++){
    key = keys[i];
    value = schema[key];

    this.path(prefix + key, value);
  }
};

function getSchemaType(name, options){
  var Type = options.type || options;
  var typeName = Type.name;

  if (builtinTypes[typeName]){
    return new Types[typeName](name, options);
  } else {
    return new Type(name, options);
  }
}

/**
 * Gets/Sets a path.
 *
 * @method path
 * @param {String} name
 * @param {*} obj
 * @return {SchemaType}
 */
Schema.prototype.path = function(name, obj){
  if (obj == null){
    return this.paths[name];
  }

  var type;
  var nested = false;

  if (obj instanceof SchemaType){
    type = obj;
  } else {
    switch (typeof obj){
      case 'function':
        type = getSchemaType(name, {type: obj});
        break;

      case 'object':
        if (obj.type){
          type = getSchemaType(name, obj);
        } else if (isArray(obj)){
          type = new Types.Array(name, {
            child: obj.length ? getSchemaType(name, obj[0]) : new SchemaType(name)
          });
        } else {
          type = new Types.Object();
          nested = Object.keys(obj).length > 0;
        }

        break;

      default:
        throw new TypeError('Invalid value for schema path `' + name + '`');
    }
  }

  this.paths[name] = type;
  this._updateStack(name, type);

  if (nested) this.add(obj, name + '.');
};

/**
 * Updates cache stacks.
 *
 * @method _updateStack
 * @param {String} name
 * @param {SchemaType} type
 * @private
 */
Schema.prototype._updateStack = function(name, type){
  var stacks = this.stacks;

  stacks.getter.push(function(data){
    var value = getProp(data, name);
    var result = type.cast(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      setProp(data, name, result);
    }
  });

  stacks.setter.push(function(data){
    var value = getProp(data, name);
    var result = type.validate(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      setProp(data, name, result);
    } else {
      delProp(data, name);
    }
  });

  stacks.import.push(function(data){
    var value = getProp(data, name);
    var result = type.parse(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      setProp(data, name, result);
    }
  });

  stacks.export.push(function(data){
    var value = getProp(data, name);
    var result = type.value(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      setProp(data, name, result);
    } else {
      delProp(data, name);
    }
  });
};

/**
 * Adds a virtual path.
 *
 * @method virtual
 * @param {String} name
 * @param {Function} [getter]
 * @return {SchemaType.Virtual}
 */
Schema.prototype.virtual = function(name, getter){
  var virtual = new Types.Virtual(name, {});
  if (getter) virtual.get(getter);

  this.path(name, virtual);

  return virtual;
};

function checkHookType(type){
  if (type !== 'save' && type !== 'remove'){
    throw new TypeError('Hook type must be `save` or `remove`!');
  }
}

function hookWrapper(fn){
  if (fn.length > 1){
    return function(data){
      return new Promise(function(resolve, reject){
        fn(data, function(err){
          if (err){
            reject(err);
          } else {
            resolve();
          }
        });
      });
    };
  } else {
    return Promise.method(fn);
  }
}

/**
 * Adds a pre-hook.
 *
 * @method pre
 * @param {String} type Hook type. One of `save` or `remove`.
 * @param {Function} fn
 */
Schema.prototype.pre = function(type, fn){
  checkHookType(type);
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

  this.hooks.pre[type].push(hookWrapper(fn));
};

/**
 * Adds a post-hook.
 *
 * @method post
 * @param {String} type Hook type. One of `save` or `remove`.
 * @param {Function} fn
 */

Schema.prototype.post = function(type, fn){
  checkHookType(type);
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

  this.hooks.post[type].push(hookWrapper(fn));
};

/**
 * Adds a instance method.
 *
 * @method method
 * @param {String} name
 * @param {Function} fn
 */
Schema.prototype.method = function(name, fn){
  if (!name) throw new TypeError('Method name is required!');

  if (typeof fn !== 'function'){
    throw new TypeError('Instance method must be a function!');
  }

  this.methods[name] = fn;
};

/**
 * Adds a static method.
 *
 * @method static
 * @param {String} name
 * @param {Function} fn
 */
Schema.prototype.static = function(name, fn){
  if (!name) throw new TypeError('Method name is required!');

  if (typeof fn !== 'function'){
    throw new TypeError('Static method must be a function!');
  }

  this.statics[name] = fn;
};

/**
 * Apply getters.
 *
 * @method _applyGetters
 * @param {Object} data
 * @return {*}
 * @private
 */
Schema.prototype._applyGetters = function(data){
  var stack = this.stacks.getter;
  var err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) return err;
  }
};

/**
 * Apply setters.
 *
 * @method _applySetters
 * @param {Object} data
 * @return {*}
 * @private
 */
Schema.prototype._applySetters = function(data){
  var stack = this.stacks.setter;
  var err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) throw err;
  }
};

/**
 * Parses database.
 *
 * @method _parseDatabase
 * @param {Object} data
 * @return {Object}
 * @private
 */
Schema.prototype._parseDatabase = function(data){
  var stack = this.stacks.import;
  var err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) throw err;
  }

  return data;
};

/**
 * Exports database.
 *
 * @method _exportDatabase
 * @param {Object} data
 * @return {Object}
 * @private
 */
Schema.prototype._exportDatabase = function(data){
  var stack = this.stacks.export;
  var err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) return err;
  }

  return data;
};

function updateStackNormal(key, update){
  return function(data){
    setProp(data, key, update);
  };
}

function updateStackOperator(path_, ukey, key, update){
  var path = path_ || new SchemaType(key);

  return function(data){
    var result = path[ukey](getProp(data, key), update, data);
    if (result instanceof Error) return result;

    setProp(data, key, result);
  };
}

/**
 * Parses updating expressions and returns a stack.
 *
 * @method _parseUpdate
 * @param {Object} updates
 * @param {String} [prefix]
 * @return {Array}
 * @private
 */
Schema.prototype._parseUpdate = function(updates, prefix_){
  var prefix = prefix_ || '';
  var paths = this.paths;
  var stack = [];
  var keys = Object.keys(updates);
  var key, update, ukey, name, path, fields, field, j, fieldLen, prefixNoDot;

  if (prefix){
    prefixNoDot = prefix.substring(0, prefix.length - 1);
    path = paths[prefixNoDot];
  }

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    update = updates[key];
    name = prefix + key;

    // Update operators
    if (key[0] === '$'){
      ukey = 'u' + key;

      // First-class update operators
      if (prefix){
        stack.push(updateStackOperator(path, ukey, prefixNoDot, update));
      } else { // Inline update operators
        fields = Object.keys(update);
        fieldLen = fields.length;

        for (j = 0; j < fieldLen; j++){
          field = fields[i];
          stack.push(
            updateStackOperator(paths[field],ukey, field, update[field]));
        }
      }
    } else if (update.constructor === Object){ // Literal objects
      stack = stack.concat(this._parseUpdate(update, name + '.'));
    } else {
      stack.push(updateStackNormal(name, update));
    }
  }

  return stack;
};

function queryStackNormal(path_, key, query){
  var path = path_ || new SchemaType(key);

  return function(data){
    return path.match(getProp(data, key), query, data);
  };
}

function queryStackOperator(path_, qkey, key, query){
  var path = path_ || new SchemaType(key);

  return function(data){
    return path[qkey](getProp(data, key), query, data);
  };
}

function execQueryStack(stack){
  var len = stack.length;
  var i;

  return function(data){
    for (i = 0; i < len; i++){
      if (!stack[i](data)) return false;
    }

    return true;
  };
}

function $or(stack){
  var len = stack.length;
  var i;

  return function(data){
    for (i = 0; i < len; i++){
      if (stack[i](data)) return true;
    }

    return false;
  };
}

function $nor(stack){
  var len = stack.length;
  var i;

  return function(data){
    for (i = 0; i < len; i++){
      if (stack[i](data)) return false;
    }

    return true;
  };
}

function $not(stack){
  var fn = execQueryStack(stack);

  return function(data){
    return !fn(data);
  };
}

function $where(fn){
  return function(data){
    return fn.call(data);
  };
}

/**
 * Parses array of query expressions and returns a stack.
 *
 * @method _parseQueryArray
 * @param {Array} arr
 * @return {Array}
 * @private
 */
Schema.prototype._parseQueryArray = function(arr){
  var stack = [];

  for (var i = 0, len = arr.length; i < len; i++){
    stack.push(execQueryStack(this._parseQuery(arr[i])));
  }

  return stack;
};

/**
 * Parses normal query expressions and returns a stack.
 *
 * @method _parseNormalQuery
 * @param {Array} queries
 * @param {String} [prefix]
 * @return {Array}
 * @private
 */
Schema.prototype._parseNormalQuery = function(queries, prefix_){
  var prefix = prefix_ || '';
  var paths = this.paths;
  var stack = [];
  var keys = Object.keys(queries);
  var key, query, name, path, prefixNoDot;

  if (prefix){
    prefixNoDot = prefix.substring(0, prefix.length - 1);
    path = paths[prefixNoDot];
  }

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    query = queries[key];
    name = prefix + key;

    if (key[0] === '$'){
      stack.push(queryStackOperator(path, 'q' + key, prefixNoDot, query));
    } else if (query.constructor === Object){
      stack = stack.concat(this._parseNormalQuery(query, name + '.'));
    } else {
      stack.push(queryStackNormal(paths[name], name, query));
    }
  }

  return stack;
};

/**
 * Parses query expressions and returns a stack.
 *
 * @method _parseQuery
 * @param {Array} queries
 * @return {Array}
 * @private
 */
Schema.prototype._parseQuery = function(queries){
  var stack = [];
  var paths = this.paths;
  var keys = Object.keys(queries);
  var key, query;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    query = queries[key];

    switch (key){
      case '$and':
        stack = stack.concat(this._parseQueryArray(query));
        break;

      case '$or':
        stack.push($or(this._parseQueryArray(query)));
        break;

      case '$nor':
        stack.push($nor(this._parseQueryArray(query)));
        break;

      case '$not':
        stack.push($not(this._parseQuery(query)));
        break;

      case '$where':
        stack.push($where(query));
        break;

      default:
        if (query.constructor === Object){ // Literal object
          stack = stack.concat(this._parseNormalQuery(query, key + '.'));
        } else {
          stack.push(queryStackNormal(paths[key], key, query));
        }
    }
  }

  return stack;
};

/**
 * Returns a function for querying.
 *
 * @method _execQuery
 * @param {Object} query
 * @return {Function}
 * @private
 */
Schema.prototype._execQuery = function(query){
  var stack = this._parseQuery(query);
  return execQueryStack(stack);
};

function execSortStack(stack){
  var len = stack.length;
  var i;

  return function(a, b){
    var result;

    for (i = 0; i < len; i++){
      result = stack[i](a, b);
      if (result) break;
    }

    return result;
  };
}

function sortStack(path_, key, sort){
  var path = path_ || new SchemaType(key);
  var descending = sort === 'desc' || sort === -1;

  return function(a, b){
    var result = path.compare(getProp(a, key), getProp(b, key));
    return descending && result ? result * -1 : result;
  };
}

/**
 * Parses sorting expressions and returns a stack.
 *
 * @method _parseSort
 * @param {Object} sorts
 * @param {String} [prefix]
 * @return {Array}
 * @private
 */
Schema.prototype._parseSort = function(sorts, prefix_){
  var prefix = prefix_ || '';
  var paths = this.paths;
  var stack = [];
  var keys = Object.keys(sorts);
  var key, sort, name;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    sort = sorts[key];
    name = prefix + key;

    if (typeof sort === 'object'){
      stack = stack.concat(this._parseSort(sort, name + '.'));
    } else {
      stack.push(sortStack(paths[name], name, sort));
    }
  }

  return stack;
};

/**
 * Returns a function for sorting.
 *
 * @method _execSort
 * @param {Object} sorts
 * @return {Function}
 * @private
 */
Schema.prototype._execSort = function(sorts){
  var stack = this._parseSort(sorts);
  return execSortStack(stack);
};

/**
 * Parses population expression and returns a stack.
 *
 * @method _parsePopulate
 * @param {String|Object} expr
 * @return {Array}
 * @private
 */
Schema.prototype._parsePopulate = function(expr){
  var paths = this.paths;
  var arr, i, len, item, path, key, ref;

  if (typeof expr === 'string'){
    var split = expr.split(' ');
    arr = [];

    for (i = 0, len = split.length; i < len; i++){
      arr.push({
        path: split[i]
      });
    }
  } else if (isArray(expr)){
    for (i = 0, len = expr.length; i < len; i++){
      item = expr[i];

      if (typeof item === 'string'){
        arr.push({
          path: item
        });
      } else {
        arr.push(item);
      }
    }
  } else {
    arr = [expr];
  }

  for (i = 0, len = arr.length; i < len; i++){
    item = arr[i];
    key = item.path;

    if (!key){
      throw new PopulationError('path is required');
    }

    if (!item.model){
      path = paths[key];
      ref = path.child ? path.child.options.ref : path.options.ref;

      if (ref){
        item.model = ref;
      } else {
        throw new PopulationError('model is required');
      }
    }
  }

  return arr;
};

/**
 * @property {Object} Types
 * @static
 */
Schema.Types = Schema.prototype.Types = Types;

module.exports = Schema;