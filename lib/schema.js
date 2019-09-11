'use strict';

const SchemaType = require('./schematype');
const Types = require('./types');
const Promise = require('bluebird');
const { getProp, setProp, delProp } = require('./util');
const PopulationError = require('./error/population');
const isPlainObject = require('is-plain-object');

const builtinTypes = new Set(['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Buffer']);

const getSchemaType = (name, options) => {
  const Type = options.type || options;
  const typeName = Type.name;

  if (builtinTypes.has(typeName)) {
    return new Types[typeName](name, options);
  }

  return new Type(name, options);
};

const checkHookType = type => {
  if (type !== 'save' && type !== 'remove') {
    throw new TypeError('Hook type must be `save` or `remove`!');
  }
};

const hookWrapper = fn => {
  if (fn.length > 1) {
    return Promise.promisify(fn);
  }

  return Promise.method(fn);
};

const execSortStack = stack => {
  const len = stack.length;

  return (a, b) => {
    let result;

    for (let i = 0; i < len; i++) {
      result = stack[i](a, b);
      if (result) break;
    }

    return result;
  };
};

const sortStack = (path_, key, sort) => {
  const path = path_ || new SchemaType(key);
  const descending = sort === 'desc' || sort === -1;

  return (a, b) => {
    const result = path.compare(getProp(a, key), getProp(b, key));
    return descending && result ? result * -1 : result;
  };
};

/**
 * @private
 */
class QueryParser {
  static updateStackNormal(key, update) {
    return data => { setProp(data, key, update); };
  }

  static updateStackOperator(path_, ukey, key, update) {
    const path = path_ || new SchemaType(key);

    return data => {
      const result = path[ukey](getProp(data, key), update, data);
      setProp(data, key, result);
    };
  }

  static queryStackNormal(path_, key, query) {
    const path = path_ || new SchemaType(key);

    return data => path.match(getProp(data, key), query, data);
  }

  static execQueryStack(stack) {
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (!stack[i](data)) return false;
      }

      return true;
    };
  }

  static queryStackOperator(path_, qkey, key, query) {
    const path = path_ || new SchemaType(key);

    return data => path[qkey](getProp(data, key), query, data);
  }

  constructor(paths) {
    this.paths = paths;
  }

  $or(query) {
    const stack = this.parseQueryArray(query);
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (stack[i](data)) return true;
      }

      return false;
    };
  }

  $nor(query) {
    const stack = this.parseQueryArray(query);
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (stack[i](data)) return false;
      }

      return true;
    };
  }

  $not(query) {
    const fn = this.execQuery(query);

    return data => !fn(data);
  }

  $where(fn) {
    return data => fn.call(data);
  }


  /**
   * Parses updating expressions and returns a stack.
   *
   * @param {Object} updates
   * @param {String} [prefix]
   * @return {Array}
   * @private
   */
  parseUpdate(updates, prefix = '', stack = []) {
    const { paths } = this;
    const { updateStackOperator } = QueryParser;
    const keys = Object.keys(updates);
    let path, prefixNoDot;

    if (prefix) {
      prefixNoDot = prefix.substring(0, prefix.length - 1);
      path = paths[prefixNoDot];
    }

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const update = updates[key];
      const name = prefix + key;

      // Update operators
      if (key[0] === '$') {
        const ukey = `u${key}`;

        // First-class update operators
        if (prefix) {
          stack.push(updateStackOperator(path, ukey, prefixNoDot, update));
        } else { // Inline update operators
          const fields = Object.keys(update);
          const fieldLen = fields.length;

          for (let j = 0; j < fieldLen; j++) {
            const field = fields[i];
            stack.push(
              updateStackOperator(paths[field], ukey, field, update[field]));
          }
        }
      } else if (isPlainObject(update)) {
        this.parseUpdate(update, `${name}.`, stack);
      } else {
        stack.push(QueryParser.updateStackNormal(name, update));
      }
    }

    return stack;
  }

  /**
   * Parses array of query expressions and returns a stack.
   *
   * @param {Array} arr
   * @param {Array} [stack]
   * @return {Array}
   * @private
   */
  parseQueryArray(arr, stack = []) {
    for (let i = 0, len = arr.length; i < len; i++) {
      stack.push(this.execQuery(arr[i]));
    }

    return stack;
  }

  /**
   * Parses normal query expressions and returns a stack.
   *
   * @param {Array} queries
   * @param {String} [prefix]
   * @param {Array} [stack]
   * @return {Array}
   * @private
   */
  parseNormalQuery(queries, prefix = '', stack = []) {
    const { paths } = this;
    const keys = Object.keys(queries);
    let path, prefixNoDot;

    if (prefix) {
      prefixNoDot = prefix.slice(0, -1);
      path = paths[prefixNoDot];
    }

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const query = queries[key];
      const name = prefix + key;

      if (key[0] === '$') {
        stack.push(QueryParser.queryStackOperator(path, `q${key}`, prefixNoDot, query));
      } else if (isPlainObject(query)) {
        this.parseNormalQuery(query, `${name}.`, stack);
      } else {
        stack.push(QueryParser.queryStackNormal(paths[name], name, query));
      }
    }

    return stack;
  }

  /**
   * Parses query expressions and returns a stack.
   *
   * @param {Object} queries
   * @return {Array}
   * @private
   */
  parseQuery(queries) {
    let stack = [];
    const { paths } = this;
    const keys = Object.keys(queries);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const query = queries[key];

      switch (key) {
        case '$and':
          this.parseQueryArray(query, stack);
          break;

        case '$or':
          stack.push(this.$or(query));
          break;

        case '$nor':
          stack.push(this.$nor(query));
          break;

        case '$not':
          stack.push(this.$not(query));
          break;

        case '$where':
          stack.push(this.$where(query));
          break;

        default:
          if (isPlainObject(query)) {
            this.parseNormalQuery(query, `${key}.`, stack);
          } else {
            stack.push(QueryParser.queryStackNormal(paths[key], key, query));
          }
      }
    }

    return stack;
  }

  execQuery(query) {
    return QueryParser.execQueryStack(this.parseQuery(query));
  }
}

class Schema {

  /**
   * Schema constructor.
   *
   * @param {Object} schema
   */
  constructor(schema) {
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
  add(schema, prefix = '') {
    const keys = Object.keys(schema);
    const len = keys.length;

    if (!len) return;

    for (let i = 0; i < len; i++) {
      const key = keys[i];
      const value = schema[key];

      this.path(prefix + key, value);
    }
  }

  /**
   * Gets/Sets a path.
   *
   * @param {String} name
   * @param {*} obj
   * @return {SchemaType}
   */
  path(name, obj) {
    if (obj == null) {
      return this.paths[name];
    }

    let type;
    let nested = false;

    if (obj instanceof SchemaType) {
      type = obj;
    } else {
      switch (typeof obj) {
        case 'function':
          type = getSchemaType(name, {type: obj});
          break;

        case 'object':
          if (obj.type) {
            type = getSchemaType(name, obj);
          } else if (Array.isArray(obj)) {
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
  }

  /**
   * Updates cache stacks.
   *
   * @param {String} name
   * @param {SchemaType} type
   * @private
   */
  _updateStack(name, type) {
    const { stacks } = this;

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
  }

  /**
   * Adds a virtual path.
   *
   * @param {String} name
   * @param {Function} [getter]
   * @return {SchemaType.Virtual}
   */
  virtual(name, getter) {
    const virtual = new Types.Virtual(name, {});
    if (getter) virtual.get(getter);

    this.path(name, virtual);

    return virtual;
  }

  /**
   * Adds a pre-hook.
   *
   * @param {String} type Hook type. One of `save` or `remove`.
   * @param {Function} fn
   */
  pre(type, fn) {
    checkHookType(type);
    if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

    this.hooks.pre[type].push(hookWrapper(fn));
  }

  /**
   * Adds a post-hook.
   *
   * @param {String} type Hook type. One of `save` or `remove`.
   * @param {Function} fn
   */
  post(type, fn) {
    checkHookType(type);
    if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

    this.hooks.post[type].push(hookWrapper(fn));
  }

  /**
   * Adds a instance method.
   *
   * @param {String} name
   * @param {Function} fn
   */
  method(name, fn) {
    if (!name) throw new TypeError('Method name is required!');

    if (typeof fn !== 'function') {
      throw new TypeError('Instance method must be a function!');
    }

    this.methods[name] = fn;
  }

  /**
   * Adds a static method.
   *
   * @param {String} name
   * @param {Function} fn
   */
  static(name, fn) {
    if (!name) throw new TypeError('Method name is required!');

    if (typeof fn !== 'function') {
      throw new TypeError('Static method must be a function!');
    }

    this.statics[name] = fn;
  }

  /**
   * Apply getters.
   *
   * @param {Object} data
   * @return {*}
   * @private
   */
  _applyGetters(data) {
    const stack = this.stacks.getter;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }
  }

  /**
   * Apply setters.
   *
   * @param {Object} data
   * @return {*}
   * @private
   */
  _applySetters(data) {
    const stack = this.stacks.setter;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }
  }

  /**
   * Parses database.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */
  _parseDatabase(data) {
    const stack = this.stacks.import;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }

    return data;
  }

  /**
   * Exports database.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */
  _exportDatabase(data) {
    const stack = this.stacks.export;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }

    return data;
  }

  /**
   * Parses updating expressions and returns a stack.
   *
   * @param {Object} updates
   * @return {Array}
   * @private
   */
  _parseUpdate(updates) {
    return (new QueryParser(this.paths)).parseUpdate(updates);
  }

  /**
   * Returns a function for querying.
   *
   * @param {Object} query
   * @return {Function}
   * @private
   */
  _execQuery(query) {
    return (new QueryParser(this.paths)).execQuery(query);
  }

  /**
   * Parses sorting expressions and returns a stack.
   *
   * @param {Object} sorts
   * @param {String} [prefix]
   * @return {Array}
   * @private
   */
  _parseSort(sorts, prefix = '') {
    const { paths } = this;
    let stack = [];
    const keys = Object.keys(sorts);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const sort = sorts[key];
      const name = prefix + key;

      if (typeof sort === 'object') {
        stack = stack.concat(this._parseSort(sort, `${name}.`));
      } else {
        stack.push(sortStack(paths[name], name, sort));
      }
    }

    return stack;
  }

  /**
   * Returns a function for sorting.
   *
   * @param {Object} sorts
   * @return {Function}
   * @private
   */
  _execSort(sorts) {
    const stack = this._parseSort(sorts);
    return execSortStack(stack);
  }

  /**
   * Parses population expression and returns a stack.
   *
   * @param {String|Object} expr
   * @return {Array}
   * @private
   */
  _parsePopulate(expr) {
    const { paths } = this;
    const arr = [];

    if (typeof expr === 'string') {
      const split = expr.split(' ');

      for (let i = 0, len = split.length; i < len; i++) {
        arr[i] = { path: split[i] };
      }
    } else if (Array.isArray(expr)) {
      for (let i = 0, len = expr.length; i < len; i++) {
        const item = expr[i];

        arr[i] = typeof item === 'string' ? { path: item } : item;
      }
    } else {
      arr[0] = expr;
    }

    for (let i = 0, len = arr.length; i < len; i++) {
      const item = arr[i];
      const key = item.path;

      if (!key) {
        throw new PopulationError('path is required');
      }

      if (!item.model) {
        const path = paths[key];
        const ref = path.child ? path.child.options.ref : path.options.ref;

        if (!ref) {
          throw new PopulationError('model is required');
        }

        item.model = ref;
      }
    }

    return arr;
  }
}

Schema.Types = Schema.prototype.Types = Types;

module.exports = Schema;
