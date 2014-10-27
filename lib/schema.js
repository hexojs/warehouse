'use strict';

var SchemaType = require('./schematype'),
  Types = require('./types'),
  Promise = require('bluebird'),
  util = require('./util'),
  PopulationError = require('./error/population');

var getProp = util.getProp,
  setProp = util.setProp,
  delProp = util.delProp;

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
    setter: []
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

/**
 * Detects the type of schema paths.
 *
 * @method _schemaType
 * @param {String} name
 * @param {*} obj
 * @return {SchemaType}
 * @private
 */
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

  var type = obj instanceof SchemaType ? obj : this._schemaType(name, obj);

  if (type == null){
    throw new TypeError('Invalid value for schema path `' + name + '`');
  }

  this.paths[name] = type;
  this._updateStack(name, type);
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
  this.stacks.getter.push(function(data){
    var value = getProp(data, name),
      result = type.cast(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      setProp(data, name, result);
    } else if (value !== undefined){
      delProp(data, name);
    }
  });

  this.stacks.setter.push(function(data){
    var value = getProp(data, name),
      result = type.validate(value, data);

    if (result instanceof Error) return result;

    if (result !== undefined){
      setProp(data, name, result);
    } else if (value !== undefined){
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
    throw new TypeError('The type of hook must be `save` or `remove`!');
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
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');
  checkHookType(type);

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
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');
  checkHookType(type);

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
  var stack = this.stacks.getter,
    err;

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
  var stack = this.stacks.setter,
    err;

  for (var i = 0, len = stack.length; i < len; i++){
    err = stack[i](data);
    if (err instanceof Error) return err;
  }
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
  var prefix = prefix_ || '',
    paths = this.paths,
    stack = [],
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
  var prefix = prefix_ || '',
    paths = this.paths,
    stack = [],
    keys = Object.keys(queries),
    key, query, name, path, prefixNoDot;

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
  var stack = [],
    keys = Object.keys(queries),
    key, query;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    query = queries[key];

    switch (key){
      case '$and':
        stack = stack.concat(this._parseQuery(query));
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
        stack = stack.concat(this._parseNormalQuery(query));
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
  var len = stack.length,
    i;

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
  var path = path_ || new SchemaType(key),
    descending = sort === 'desc' || sort === -1;

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
  var prefix = prefix_ || '',
    paths = this.paths,
    stack = [],
    keys = Object.keys(sorts),
    key, sort, name;

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
  var stack = [],
    paths = this.paths,
    arr, i, len, item, path, key, ref;

  if (typeof expr === 'string'){
    var split = expr.split(' ');
    arr = [];

    for (i = 0, len = split.length; i < len; i++){
      arr.push({
        path: split[i]
      });
    }
  } else if (Array.isArray(expr)){
    arr = expr;
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

  return stack;
};

/**
 * @property {Object} Types
 * @static
 */
Schema.Types = Schema.prototype.Types = Types;

module.exports = Schema;