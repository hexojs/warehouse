/**
 * Module dependencies.
 */

var _ = require('lodash'),
  Virtual = require('./virtual'),
  Types = require('./types'),
  util = require('./util'),
  SchemaType = require('./schematype'),
  getProperty = util.getProperty,
  setProperty = util.setProperty;

/**
 * Creates a new schema instance.
 *
 * @param {Object} schema
 * @api public
 */

var Schema = module.exports = function(schema){
  this.tree = {};
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

  this.add(_.extend({
    _id: {type: String, default: uid}
  }, schema));
};

/**
 * Expose types.
 */

Schema.Types = Types;

/**
 * Generates a unique id of length 16.
 *
 * @return {String}
 * @api private
 */

var uid = function(){
  return util.uid(16);
};

/**
 * Adds rules to the schema.
 *
 * @param {Object} obj
 * @param {String} [prefix]
 * @api private
 */

Schema.prototype.add = function(obj, prefix){
  prefix = prefix || '';

  var self = this;

  _.each(obj, function(item, key){
    if (item == null) return;

    if (item.type){
      var type = item.type;
      item = _.omit(item, 'type');
    } else {
      var type = item.constructor === Function ? item : item.constructor;
    }

    if (type.__proto__ === SchemaType){
      self.path(prefix + key, new type(_.isObject(item) ? item : {}));
    } else if (Types.hasOwnProperty(type.name)){
      self.path(prefix + key, new Types[type.name](_.isObject(item) ? item : {}));
    } else {
      throw new Error('Type `' + type.name + '` is undefined.');
    }

    item = _.omit(item, 'default', 'required');

    if (type === Object || type === Array){
      self.add(item, prefix + key + '.');
    }
  });
};

/**
 * Gets/Sets a schema path.
 *
 * @param {String} name
 * @param {Object} [obj]
 * @return {SchemaType|Virtual}
 * @api public
 */

Schema.prototype.path = function(name, obj){
  var key = name.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.').join('._nested.');

  if (obj == null){
    return getProperty(this.tree, key);
  } else {
    setProperty(this.tree, key, obj);
    return obj;
  }
};

/**
 * Creates a virtual key.
 *
 * @param {String} name
 * @param {Function} [method]
 * @return {Virtual}
 * @api public
 */

Schema.prototype.virtual = function(name, fn){
  return this.path(name) || this.path(name, new Virtual(fn));
};

/**
 * Adds a pre hook.
 *
 * @param {String} type
 * @param {Function} fn
 * @api public
 */

Schema.prototype.pre = function(type, fn){
  if (typeof fn !== 'function') throw new Error('Schema hook must be a function!');
  if (type !== 'save' && type !== 'remove') throw new Error('Schema hook type must be `save` or `remove`!');

  this.pres[type].push(fn);
};

/**
 * Adds a post hook.
 *
 * @param {String} type
 * @param {Function} fn
 * @api public
 */

Schema.prototype.post = function(type, fn){
  if (typeof fn !== 'function') throw new Error('Schema hook must be a function!');
  if (type !== 'save' && type !== 'remove') throw new Error('Schema hook type must be `save` or `remove`!');

  this.posts[type].push(fn);
};

/**
 * Adds a method.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

Schema.prototype.method = function(name, fn){
  if (typeof fn !== 'function') throw new Error('Schema method must be a function!');
  this.methods[name] = fn;
};

/**
 * Adds a static method.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

Schema.prototype.static = function(name, fn){
  if (typeof fn !== 'function') throw new Error('Schema static must be a function!');
  this.statics[name] = fn;
};