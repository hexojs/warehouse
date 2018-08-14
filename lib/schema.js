'use strict';

const SchemaType = require('./schematype');
const Types = require('./types');
const Promise = require('bluebird');
const util = require('./util');
const PopulationError = require('./error/population');
const isPlainObject = require('is-plain-object');

const getProp = util.getProp;
const setProp = util.setProp;
const delProp = util.delProp;
const isArray = Array.isArray;

const builtinTypes = {
  String: true,
  Number: true,
  Boolean: true,
  Array: true,
  Object: true,
  Date: true,
  Buffer: true
};

/**
 * Schema constructor.
 *
 * @class
 * @param {Object} schema
 */
function Schema(schema) {
  this.paths = {};
  this.statics = {};
  this.methods = {};

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

  this.stacks = {
    getter: [],
    setter: [],
    import: [],
    export: []
  };

  if (schema) {
    this.add(schema);
  }
}

/**
 * Adds paths.
 *
 * @param {Object} schema
 * @param {String} prefix
 */
Schema.prototype.add = function(schema, prefix_) {
  const prefix = prefix_ || '';
  const keys = Object.keys(schema);
  const len = keys.length;
  let key, value;

  if (!len) return;

  for (let i = 0; i < len; i++) {
    key = keys[i];
    value = schema[key];

    this.path(prefix + key, value);
  }
};

function getSchemaType(name, options) {
  const Type = options.type || options;
  const typeName = Type.name;

  if (builtinTypes[typeName]) {
    return new Types[typeName](name, options);
  }

  return new Type(name, options);
}

/**
 * Gets/Sets a path.
 *
 * @param {String} name
 * @param {*} obj
 * @return {SchemaType}
 */
Schema.prototype.path = function(name, obj) {
  if (obj == null) {
    return this.paths[name];
  }

  let type;
  let nested = false;

  if (obj instanceof SchemaType) {
    type = obj;
  } else {
    switch (typeof obj){
      case 'function':
        type = getSchemaType(name, {type: obj});
        break;

      case 'object':
        if (obj.type) {
          type = getSchemaType(name, obj);
        } else if (isArray(obj)) {
          type = new Types.Array(name, {
            child: obj.length ? getSchemaType(name, obj[0]) : new SchemaType(name)
          });
        } else {
          type = new Types.Object();
          nested = Object.keys(obj).length > 0;
        }

        break;

      default:
        throw new TypeError(`Invalid value for schema path \`${name}\``);
    }
  }

  this.paths[name] = type;
  this._updateStack(name, type);

  if (nested) this.add(obj, `${name}.`);
};

/**
 * Updates cache stacks.
 *
 * @param {String} name
 * @param {SchemaType} type
 * @private
 */
Schema.prototype._updateStack = function(name, type) {
  const stacks = this.stacks;

  stacks.getter.push(data => {
    const value = getProp(data, name);
    const result = type.cast(value, data);

    if (result !== undefined) {
      setProp(data, name, result);
    }
  });

  stacks.setter.push(data => {
    const value = getProp(data, name);
    const result = type.validate(value, data);

    if (result !== undefined) {
      setProp(data, name, result);
    } else {
      delProp(data, name);
    }
  });

  stacks.import.push(data => {
    const value = getProp(data, name);
    const result = type.parse(value, data);

    if (result !== undefined) {
      setProp(data, name, result);
    }
  });

  stacks.export.push(data => {
    const value = getProp(data, name);
    const result = type.value(value, data);

    if (result !== undefined) {
      setProp(data, name, result);
    } else {
      delProp(data, name);
    }
  });
};

/**
 * Adds a virtual path.
 *
 * @param {String} name
 * @param {Function} [getter]
 * @return {SchemaType.Virtual}
 */
Schema.prototype.virtual = function(name, getter) {
  const virtual = new Types.Virtual(name, {});
  if (getter) virtual.get(getter);

  this.path(name, virtual);

  return virtual;
};

function checkHookType(type) {
  if (type !== 'save' && type !== 'remove') {
    throw new TypeError('Hook type must be `save` or `remove`!');
  }
}

function hookWrapper(fn) {
  if (fn.length > 1) {
    return Promise.promisify(fn);
  }

  return Promise.method(fn);
}

/**
 * Adds a pre-hook.
 *
 * @param {String} type Hook type. One of `save` or `remove`.
 * @param {Function} fn
 */
Schema.prototype.pre = function(type, fn) {
  checkHookType(type);
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

  this.hooks.pre[type].push(hookWrapper(fn));
};

/**
 * Adds a post-hook.
 *
 * @param {String} type Hook type. One of `save` or `remove`.
 * @param {Function} fn
 */
Schema.prototype.post = function(type, fn) {
  checkHookType(type);
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

  this.hooks.post[type].push(hookWrapper(fn));
};

/**
 * Adds a instance method.
 *
 * @param {String} name
 * @param {Function} fn
 */
Schema.prototype.method = function(name, fn) {
  if (!name) throw new TypeError('Method name is required!');

  if (typeof fn !== 'function') {
    throw new TypeError('Instance method must be a function!');
  }

  this.methods[name] = fn;
};

/**
 * Adds a static method.
 *
 * @param {String} name
 * @param {Function} fn
 */
Schema.prototype.static = function(name, fn) {
  if (!name) throw new TypeError('Method name is required!');

  if (typeof fn !== 'function') {
    throw new TypeError('Static method must be a function!');
  }

  this.statics[name] = fn;
};

/**
 * Apply getters.
 *
 * @param {Object} data
 * @return {*}
 * @private
 */
Schema.prototype._applyGetters = function(data) {
  const stack = this.stacks.getter;

  for (let i = 0, len = stack.length; i < len; i++) {
    stack[i](data);
  }
};

/**
 * Apply setters.
 *
 * @param {Object} data
 * @return {*}
 * @private
 */
Schema.prototype._applySetters = function(data) {
  const stack = this.stacks.setter;

  for (let i = 0, len = stack.length; i < len; i++) {
    stack[i](data);
  }
};

/**
 * Parses database.
 *
 * @param {Object} data
 * @return {Object}
 * @private
 */
Schema.prototype._parseDatabase = function(data) {
  const stack = this.stacks.import;

  for (let i = 0, len = stack.length; i < len; i++) {
    stack[i](data);
  }

  return data;
};

/**
 * Exports database.
 *
 * @param {Object} data
 * @return {Object}
 * @private
 */
Schema.prototype._exportDatabase = function(data) {
  const stack = this.stacks.export;

  for (let i = 0, len = stack.length; i < len; i++) {
    stack[i](data);
  }

  return data;
};

function updateStackNormal(key, update) {
  return data => {
    setProp(data, key, update);
  };
}

function updateStackOperator(path_, ukey, key, update) {
  const path = path_ || new SchemaType(key);

  return data => {
    const result = path[ukey](getProp(data, key), update, data);
    setProp(data, key, result);
  };
}

/**
 * Parses updating expressions and returns a stack.
 *
 * @param {Object} updates
 * @param {String} [prefix]
 * @return {Array}
 * @private
 */
Schema.prototype._parseUpdate = function(updates, prefix_) {
  const prefix = prefix_ || '';
  const paths = this.paths;
  let stack = [];
  const keys = Object.keys(updates);
  let key, update, ukey, name, path, fields, field, j, fieldLen, prefixNoDot;

  if (prefix) {
    prefixNoDot = prefix.substring(0, prefix.length - 1);
    path = paths[prefixNoDot];
  }

  for (let i = 0, len = keys.length; i < len; i++) {
    key = keys[i];
    update = updates[key];
    name = prefix + key;

    // Update operators
    if (key[0] === '$') {
      ukey = `u${key}`;

      // First-class update operators
      if (prefix) {
        stack.push(updateStackOperator(path, ukey, prefixNoDot, update));
      } else { // Inline update operators
        fields = Object.keys(update);
        fieldLen = fields.length;

        for (j = 0; j < fieldLen; j++) {
          field = fields[i];
          stack.push(
            updateStackOperator(paths[field], ukey, field, update[field]));
        }
      }
    } else if (isPlainObject(update)) {
      stack = stack.concat(this._parseUpdate(update, `${name}.`));
    } else {
      stack.push(updateStackNormal(name, update));
    }
  }

  return stack;
};

function queryStackNormal(path_, key, query) {
  const path = path_ || new SchemaType(key);

  return data => path.match(getProp(data, key), query, data);
}

function queryStackOperator(path_, qkey, key, query) {
  const path = path_ || new SchemaType(key);

  return data => path[qkey](getProp(data, key), query, data);
}

function execQueryStack(stack) {
  const len = stack.length;
  let i;

  return data => {
    for (i = 0; i < len; i++) {
      if (!stack[i](data)) return false;
    }

    return true;
  };
}

function $or(stack) {
  const len = stack.length;
  let i;

  return data => {
    for (i = 0; i < len; i++) {
      if (stack[i](data)) return true;
    }

    return false;
  };
}

function $nor(stack) {
  const len = stack.length;
  let i;

  return data => {
    for (i = 0; i < len; i++) {
      if (stack[i](data)) return false;
    }

    return true;
  };
}

function $not(stack) {
  const fn = execQueryStack(stack);

  return data => !fn(data);
}

function $where(fn) {
  return data => fn.call(data);
}

/**
 * Parses array of query expressions and returns a stack.
 *
 * @param {Array} arr
 * @return {Array}
 * @private
 */
Schema.prototype._parseQueryArray = function(arr) {
  const stack = [];

  for (let i = 0, len = arr.length; i < len; i++) {
    stack.push(execQueryStack(this._parseQuery(arr[i])));
  }

  return stack;
};

/**
 * Parses normal query expressions and returns a stack.
 *
 * @param {Array} queries
 * @param {String} [prefix]
 * @return {Array}
 * @private
 */
Schema.prototype._parseNormalQuery = function(queries, prefix_) {
  const prefix = prefix_ || '';
  const paths = this.paths;
  let stack = [];
  const keys = Object.keys(queries);
  let key, query, name, path, prefixNoDot;

  if (prefix) {
    prefixNoDot = prefix.substring(0, prefix.length - 1);
    path = paths[prefixNoDot];
  }

  for (let i = 0, len = keys.length; i < len; i++) {
    key = keys[i];
    query = queries[key];
    name = prefix + key;

    if (key[0] === '$') {
      stack.push(queryStackOperator(path, `q${key}`, prefixNoDot, query));
    } else if (isPlainObject(query)) {
      stack = stack.concat(this._parseNormalQuery(query, `${name}.`));
    } else {
      stack.push(queryStackNormal(paths[name], name, query));
    }
  }

  return stack;
};

/**
 * Parses query expressions and returns a stack.
 *
 * @param {Array} queries
 * @return {Array}
 * @private
 */
Schema.prototype._parseQuery = function(queries) {
  let stack = [];
  const paths = this.paths;
  const keys = Object.keys(queries);
  let key, query;

  for (let i = 0, len = keys.length; i < len; i++) {
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
        if (isPlainObject(query)) {
          stack = stack.concat(this._parseNormalQuery(query, `${key}.`));
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
 * @param {Object} query
 * @return {Function}
 * @private
 */
Schema.prototype._execQuery = function(query) {
  const stack = this._parseQuery(query);
  return execQueryStack(stack);
};

function execSortStack(stack) {
  const len = stack.length;
  let i;

  return (a, b) => {
    let result;

    for (i = 0; i < len; i++) {
      result = stack[i](a, b);
      if (result) break;
    }

    return result;
  };
}

function sortStack(path_, key, sort) {
  const path = path_ || new SchemaType(key);
  const descending = sort === 'desc' || sort === -1;

  return (a, b) => {
    const result = path.compare(getProp(a, key), getProp(b, key));
    return descending && result ? result * -1 : result;
  };
}

/**
 * Parses sorting expressions and returns a stack.
 *
 * @param {Object} sorts
 * @param {String} [prefix]
 * @return {Array}
 * @private
 */
Schema.prototype._parseSort = function(sorts, prefix_) {
  const prefix = prefix_ || '';
  const paths = this.paths;
  let stack = [];
  const keys = Object.keys(sorts);
  let key, sort, name;

  for (let i = 0, len = keys.length; i < len; i++) {
    key = keys[i];
    sort = sorts[key];
    name = prefix + key;

    if (typeof sort === 'object') {
      stack = stack.concat(this._parseSort(sort, `${name}.`));
    } else {
      stack.push(sortStack(paths[name], name, sort));
    }
  }

  return stack;
};

/**
 * Returns a function for sorting.
 *
 * @param {Object} sorts
 * @return {Function}
 * @private
 */
Schema.prototype._execSort = function(sorts) {
  const stack = this._parseSort(sorts);
  return execSortStack(stack);
};

/**
 * Parses population expression and returns a stack.
 *
 * @param {String|Object} expr
 * @return {Array}
 * @private
 */
Schema.prototype._parsePopulate = function(expr) {
  const paths = this.paths;
  let arr, i, len, item, path, key, ref;

  if (typeof expr === 'string') {
    const split = expr.split(' ');
    arr = [];

    for (i = 0, len = split.length; i < len; i++) {
      arr.push({
        path: split[i]
      });
    }
  } else if (isArray(expr)) {
    for (i = 0, len = expr.length; i < len; i++) {
      item = expr[i];

      if (typeof item === 'string') {
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

  for (i = 0, len = arr.length; i < len; i++) {
    item = arr[i];
    key = item.path;

    if (!key) {
      throw new PopulationError('path is required');
    }

    if (!item.model) {
      path = paths[key];
      ref = path.child ? path.child.options.ref : path.options.ref;

      if (ref) {
        item.model = ref;
      } else {
        throw new PopulationError('model is required');
      }
    }
  }

  return arr;
};

Schema.Types = Schema.prototype.Types = Types;

module.exports = Schema;
