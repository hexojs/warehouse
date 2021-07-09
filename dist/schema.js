'use strict';
var SchemaType = require('./schematype');
var Types = require('./types');
var Promise = require('bluebird');
var _a = require('./util'), getProp = _a.getProp, setProp = _a.setProp, delProp = _a.delProp;
var PopulationError = require('./error/population');
var isPlainObject = require('is-plain-object').isPlainObject;
/**
 * @callback queryFilterCallback
 * @param {*} data
 * @return {boolean}
 */
/**
 * @callback queryCallback
 * @param {*} data
 * @return {void}
 */
/**
 * @callback queryParseCallback
 * @param {*} a
 * @param {*} b
 * @returns {*}
 */
/**
 * @typedef PopulateResult
 * @property {string} path
 * @property {*} model
 */
var builtinTypes = new Set(['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Buffer']);
var getSchemaType = function (name, options) {
    var Type = options.type || options;
    var typeName = Type.name;
    if (builtinTypes.has(typeName)) {
        return new Types[typeName](name, options);
    }
    return new Type(name, options);
};
var checkHookType = function (type) {
    if (type !== 'save' && type !== 'remove') {
        throw new TypeError('Hook type must be `save` or `remove`!');
    }
};
var hookWrapper = function (fn) {
    if (fn.length > 1) {
        return Promise.promisify(fn);
    }
    return Promise.method(fn);
};
/**
 * @param {Function[]} stack
 */
var execSortStack = function (stack) {
    var len = stack.length;
    return function (a, b) {
        var result;
        for (var i = 0; i < len; i++) {
            result = stack[i](a, b);
            if (result)
                break;
        }
        return result;
    };
};
var sortStack = function (path_, key, sort) {
    var path = path_ || new SchemaType(key);
    var descending = sort === 'desc' || sort === -1;
    return function (a, b) {
        var result = path.compare(getProp(a, key), getProp(b, key));
        return descending && result ? result * -1 : result;
    };
};
var UpdateParser = /** @class */ (function () {
    function UpdateParser(paths) {
        this.paths = paths;
    }
    UpdateParser.updateStackNormal = function (key, update) {
        return function (data) { setProp(data, key, update); };
    };
    UpdateParser.updateStackOperator = function (path_, ukey, key, update) {
        var path = path_ || new SchemaType(key);
        return function (data) {
            var result = path[ukey](getProp(data, key), update, data);
            setProp(data, key, result);
        };
    };
    /**
     * Parses updating expressions and returns a stack.
     *
     * @param {Object} updates
     * @param {queryCallback[]} [stack]
     * @private
     */
    UpdateParser.prototype.parseUpdate = function (updates, prefix, stack) {
        if (prefix === void 0) { prefix = ''; }
        if (stack === void 0) { stack = []; }
        var paths = this.paths;
        var updateStackOperator = UpdateParser.updateStackOperator;
        var keys = Object.keys(updates);
        var path, prefixNoDot;
        if (prefix) {
            prefixNoDot = prefix.substring(0, prefix.length - 1);
            path = paths[prefixNoDot];
        }
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var update = updates[key];
            var name_1 = prefix + key;
            // Update operators
            if (key[0] === '$') {
                var ukey = "u" + key;
                // First-class update operators
                if (prefix) {
                    stack.push(updateStackOperator(path, ukey, prefixNoDot, update));
                }
                else { // Inline update operators
                    var fields = Object.keys(update);
                    var fieldLen = fields.length;
                    for (var j = 0; j < fieldLen; j++) {
                        var field = fields[i];
                        stack.push(updateStackOperator(paths[field], ukey, field, update[field]));
                    }
                }
            }
            else if (isPlainObject(update)) {
                this.parseUpdate(update, name_1 + ".", stack);
            }
            else {
                stack.push(UpdateParser.updateStackNormal(name_1, update));
            }
        }
        return stack;
    };
    return UpdateParser;
}());
/**
 * @private
 */
var QueryParser = /** @class */ (function () {
    function QueryParser(paths) {
        this.paths = paths;
    }
    /**
     *
     * @param {string} name
     * @param {*} query
     * @return {queryFilterCallback}
     */
    QueryParser.prototype.queryStackNormal = function (name, query) {
        var path = this.paths[name] || new SchemaType(name);
        return function (data) { return path.match(getProp(data, name), query, data); };
    };
    /**
     *
     * @param {string} qkey
     * @param {string} name
     * @param {*} query
     * @return {queryFilterCallback}
     */
    QueryParser.prototype.queryStackOperator = function (qkey, name, query) {
        var path = this.paths[name] || new SchemaType(name);
        return function (data) { return path[qkey](getProp(data, name), query, data); };
    };
    /**
     * @param {Array} arr
     * @param {queryFilterCallback[]} stack The function generated by query is added to the stack.
     * @return {void}
     * @private
     */
    QueryParser.prototype.$and = function (arr, stack) {
        for (var i = 0, len = arr.length; i < len; i++) {
            stack.push(this.execQuery(arr[i]));
        }
    };
    /**
     * @param {Array} query
     * @return {queryFilterCallback}
     * @private
     */
    QueryParser.prototype.$or = function (query) {
        var stack = this.parseQueryArray(query);
        var len = stack.length;
        return function (data) {
            for (var i = 0; i < len; i++) {
                if (stack[i](data))
                    return true;
            }
            return false;
        };
    };
    /**
     * @param {Array} query
     * @return {queryFilterCallback}
     * @private
     */
    QueryParser.prototype.$nor = function (query) {
        var stack = this.parseQueryArray(query);
        var len = stack.length;
        return function (data) {
            for (var i = 0; i < len; i++) {
                if (stack[i](data))
                    return false;
            }
            return true;
        };
    };
    /**
     * @param {*} query
     * @return {queryFilterCallback}
     * @private
     */
    QueryParser.prototype.$not = function (query) {
        var stack = this.parseQuery(query);
        var len = stack.length;
        return function (data) {
            for (var i = 0; i < len; i++) {
                if (!stack[i](data))
                    return true;
            }
            return false;
        };
    };
    /**
     * @callback queryWherecallback
     * @return {boolean}
     * @this {QueryPerser}
     */
    /**
     * @param {queryWherecallback} fn
     * @return {queryFilterCallback}
     * @private
     */
    QueryParser.prototype.$where = function (fn) {
        return function (data) { return Reflect.apply(fn, data, []); };
    };
    /**
     * Parses array of query expressions and returns a stack.
     *
     * @param {Array} arr
     * @return {queryFilterCallback[]}
     * @private
     */
    QueryParser.prototype.parseQueryArray = function (arr) {
        var stack = [];
        this.$and(arr, stack);
        return stack;
    };
    /**
     * Parses normal query expressions and returns a stack.
     *
     * @param {Object} queries
     * @param {String} prefix
     * @param {queryFilterCallback[]} [stack] The function generated by query is added to the stack passed in this argument. If not passed, a new stack will be created.
     * @return {void}
     * @private
     */
    QueryParser.prototype.parseNormalQuery = function (queries, prefix, stack) {
        if (stack === void 0) { stack = []; }
        var keys = Object.keys(queries);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var query = queries[key];
            if (key[0] === '$') {
                stack.push(this.queryStackOperator("q" + key, prefix, query));
                continue;
            }
            var name_2 = prefix + "." + key;
            if (isPlainObject(query)) {
                this.parseNormalQuery(query, name_2, stack);
            }
            else {
                stack.push(this.queryStackNormal(name_2, query));
            }
        }
    };
    /**
     * Parses query expressions and returns a stack.
     *
     * @param {Object} queries
     * @return {queryFilterCallback[]}
     * @private
     */
    QueryParser.prototype.parseQuery = function (queries) {
        /** @type {queryFilterCallback[]} */
        var stack = [];
        var keys = Object.keys(queries);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var query = queries[key];
            switch (key) {
                case '$and':
                    this.$and(query, stack);
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
                        this.parseNormalQuery(query, key, stack);
                    }
                    else {
                        stack.push(this.queryStackNormal(key, query));
                    }
            }
        }
        return stack;
    };
    /**
     * Returns a function for querying.
     *
     * @param {Object} query
     * @return {queryFilterCallback}
     * @private
     */
    QueryParser.prototype.execQuery = function (query) {
        var stack = this.parseQuery(query);
        var len = stack.length;
        return function (data) {
            for (var i = 0; i < len; i++) {
                if (!stack[i](data))
                    return false;
            }
            return true;
        };
    };
    return QueryParser;
}());
var Schema = /** @class */ (function () {
    /**
     * Schema constructor.
     *
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
    Schema.prototype.add = function (schema, prefix) {
        if (prefix === void 0) { prefix = ''; }
        var keys = Object.keys(schema);
        var len = keys.length;
        if (!len)
            return;
        for (var i = 0; i < len; i++) {
            var key = keys[i];
            var value = schema[key];
            this.path(prefix + key, value);
        }
    };
    /**
     * Gets/Sets a path.
     *
     * @param {String} name
     * @param {*} obj
     * @return {SchemaType | undefined}
     */
    Schema.prototype.path = function (name, obj) {
        if (obj == null) {
            return this.paths[name];
        }
        var type;
        var nested = false;
        if (obj instanceof SchemaType) {
            type = obj;
        }
        else {
            switch (typeof obj) {
                case 'function':
                    type = getSchemaType(name, { type: obj });
                    break;
                case 'object':
                    if (obj.type) {
                        type = getSchemaType(name, obj);
                    }
                    else if (Array.isArray(obj)) {
                        type = new Types.Array(name, {
                            child: obj.length ? getSchemaType(name, obj[0]) : new SchemaType(name)
                        });
                    }
                    else {
                        type = new Types.Object();
                        nested = Object.keys(obj).length > 0;
                    }
                    break;
                default:
                    throw new TypeError("Invalid value for schema path `" + name + "`");
            }
        }
        this.paths[name] = type;
        this._updateStack(name, type);
        if (nested)
            this.add(obj, name + ".");
    };
    /**
     * Updates cache stacks.
     *
     * @param {String} name
     * @param {SchemaType} type
     * @private
     */
    Schema.prototype._updateStack = function (name, type) {
        var stacks = this.stacks;
        stacks.getter.push(function (data) {
            var value = getProp(data, name);
            var result = type.cast(value, data);
            if (result !== undefined) {
                setProp(data, name, result);
            }
        });
        stacks.setter.push(function (data) {
            var value = getProp(data, name);
            var result = type.validate(value, data);
            if (result !== undefined) {
                setProp(data, name, result);
            }
            else {
                delProp(data, name);
            }
        });
        stacks.import.push(function (data) {
            var value = getProp(data, name);
            var result = type.parse(value, data);
            if (result !== undefined) {
                setProp(data, name, result);
            }
        });
        stacks.export.push(function (data) {
            var value = getProp(data, name);
            var result = type.value(value, data);
            if (result !== undefined) {
                setProp(data, name, result);
            }
            else {
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
    Schema.prototype.virtual = function (name, getter) {
        var virtual = new Types.Virtual(name, {});
        if (getter)
            virtual.get(getter);
        this.path(name, virtual);
        return virtual;
    };
    /**
     * Adds a pre-hook.
     *
     * @param {String} type Hook type. One of `save` or `remove`.
     * @param {Function} fn
     */
    Schema.prototype.pre = function (type, fn) {
        checkHookType(type);
        if (typeof fn !== 'function')
            throw new TypeError('Hook must be a function!');
        this.hooks.pre[type].push(hookWrapper(fn));
    };
    /**
     * Adds a post-hook.
     *
     * @param {String} type Hook type. One of `save` or `remove`.
     * @param {Function} fn
     */
    Schema.prototype.post = function (type, fn) {
        checkHookType(type);
        if (typeof fn !== 'function')
            throw new TypeError('Hook must be a function!');
        this.hooks.post[type].push(hookWrapper(fn));
    };
    /**
     * Adds a instance method.
     *
     * @param {String} name
     * @param {Function} fn
     */
    Schema.prototype.method = function (name, fn) {
        if (!name)
            throw new TypeError('Method name is required!');
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
    Schema.prototype.static = function (name, fn) {
        if (!name)
            throw new TypeError('Method name is required!');
        if (typeof fn !== 'function') {
            throw new TypeError('Static method must be a function!');
        }
        this.statics[name] = fn;
    };
    /**
     * Apply getters.
     *
     * @param {Object} data
     * @return {void}
     * @private
     */
    Schema.prototype._applyGetters = function (data) {
        var stack = this.stacks.getter;
        for (var i = 0, len = stack.length; i < len; i++) {
            stack[i](data);
        }
    };
    /**
     * Apply setters.
     *
     * @param {Object} data
     * @return {void}
     * @private
     */
    Schema.prototype._applySetters = function (data) {
        var stack = this.stacks.setter;
        for (var i = 0, len = stack.length; i < len; i++) {
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
    Schema.prototype._parseDatabase = function (data) {
        var stack = this.stacks.import;
        for (var i = 0, len = stack.length; i < len; i++) {
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
    Schema.prototype._exportDatabase = function (data) {
        var stack = this.stacks.export;
        for (var i = 0, len = stack.length; i < len; i++) {
            stack[i](data);
        }
        return data;
    };
    /**
     * Parses updating expressions and returns a stack.
     *
     * @param {Object} updates
     * @return {queryCallback[]}
     * @private
     */
    Schema.prototype._parseUpdate = function (updates) {
        return new UpdateParser(this.paths).parseUpdate(updates);
    };
    /**
     * Returns a function for querying.
     *
     * @param {Object} query
     * @return {queryFilterCallback}
     * @private
     */
    Schema.prototype._execQuery = function (query) {
        return new QueryParser(this.paths).execQuery(query);
    };
    /**
     * Parses sorting expressions and returns a stack.
     *
     * @param {Object} sorts
     * @param {string} [prefix]
     * @param {queryParseCallback[]} [stack]
     * @return {queryParseCallback[]}
     * @private
     */
    Schema.prototype._parseSort = function (sorts, prefix, stack) {
        if (prefix === void 0) { prefix = ''; }
        if (stack === void 0) { stack = []; }
        var paths = this.paths;
        var keys = Object.keys(sorts);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var sort = sorts[key];
            var name_3 = prefix + key;
            if (typeof sort === 'object') {
                this._parseSort(sort, name_3 + ".", stack);
            }
            else {
                stack.push(sortStack(paths[name_3], name_3, sort));
            }
        }
        return stack;
    };
    /**
     * Returns a function for sorting.
     *
     * @param {Object} sorts
     * @return {queryParseCallback}
     * @private
     */
    Schema.prototype._execSort = function (sorts) {
        var stack = this._parseSort(sorts);
        return execSortStack(stack);
    };
    /**
     * Parses population expression and returns a stack.
     *
     * @param {String|Object} expr
     * @return {PopulateResult[]}
     * @private
     */
    Schema.prototype._parsePopulate = function (expr) {
        var paths = this.paths;
        var arr = [];
        if (typeof expr === 'string') {
            var split = expr.split(' ');
            for (var i = 0, len = split.length; i < len; i++) {
                arr[i] = { path: split[i] };
            }
        }
        else if (Array.isArray(expr)) {
            for (var i = 0, len = expr.length; i < len; i++) {
                var item = expr[i];
                arr[i] = typeof item === 'string' ? { path: item } : item;
            }
        }
        else {
            arr[0] = expr;
        }
        for (var i = 0, len = arr.length; i < len; i++) {
            var item = arr[i];
            var key = item.path;
            if (!key) {
                throw new PopulationError('path is required');
            }
            if (!item.model) {
                var path = paths[key];
                var ref = path.child ? path.child.options.ref : path.options.ref;
                if (!ref) {
                    throw new PopulationError('model is required');
                }
                item.model = ref;
            }
        }
        return arr;
    };
    return Schema;
}());
Schema.prototype.Types = Types;
Schema.Types = Schema.prototype.Types;
module.exports = Schema;
