var _ = require('lodash'),
  Virtual = require('./virtual'),
  Types = require('./types'),
  util = require('./util'),
  SchemaType = require('./schematype'),
  getProperty = util.getProperty,
  setProperty = util.setProperty;

/**
* Schema.
*
* @class Schema
* @param {Object} [schema]
* @constructor
* @namespace Warehouse
* @module warehouse
*/

var Schema = module.exports = function(schema){
  /**
  * @property tree
  * @type Object
  * @private
  */

  this.tree = {};

  /**
  * @property statics
  * @type Object
  */

  this.statics = {};

  /**
  * @property methods
  * @type Object
  */

  this.methods = {};

  /**
  * @property pres
  * @type Object
  */

  this.pres = {
    save: [],
    remove: []
  };

  /**
  * @property posts
  * @type Object
  */

  this.posts = {
    save: [],
    remove: []
  };

  this.add(_.extend({
    _id: {type: String, default: uid}
  }, schema));
};

/**
* @property Types
* @type Object
* @static
*/

Schema.Types = Types;

/**
* Generates a unique id of length 16.
*
* @method uid
* @return {String}
* @private
*/

var uid = function(){
  return util.uid(16);
};

/**
* Adds rules to the schema.
*
* @method add
* @param {Object} obj
* @param {String} [prefix]
* @private
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
* @method path
* @param {String} name
* @param {Object} [obj]
* @return {Warehouse.SchemaType|Warehouse.Virtual}
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
* @method virtual
* @param {String} name
* @param {Function} [method]
* @return {Warehouse.Virtual}
*/

Schema.prototype.virtual = function(name, fn){
  return this.path(name) || this.path(name, new Virtual(fn));
};

/**
* Adds a pre hook.
*
* @method pre
* @param {String} type
* @param {Function} fn
*/

Schema.prototype.pre = function(type, fn){
  if (typeof fn !== 'function') throw new Error('Schema hook must be a function!');
  if (type !== 'save' && type !== 'remove') throw new Error('Schema hook type must be `save` or `remove`!');

  this.pres[type].push(fn);
};

/**
* Adds a post hook.
*
* @method post
* @param {String} type
* @param {Function} fn
*/

Schema.prototype.post = function(type, fn){
  if (typeof fn !== 'function') throw new Error('Schema hook must be a function!');
  if (type !== 'save' && type !== 'remove') throw new Error('Schema hook type must be `save` or `remove`!');

  this.posts[type].push(fn);
};

/**
* Adds a method.
*
* @method method
* @param {String} name
* @param {Function} fn
*/

Schema.prototype.method = function(name, fn){
  if (typeof fn !== 'function') throw new Error('Schema method must be a function!');
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
  if (typeof fn !== 'function') throw new Error('Schema static must be a function!');
  this.statics[name] = fn;
};