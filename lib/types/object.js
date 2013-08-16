/**
 * Module dependencies.
 */

var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
 * Creates a new SchemaObject instance.
 *
 * @param {Object} [options]
 * @api public
 */

var SchemaObject = module.exports = function(options){
  options = options || {};

  SchemaType.call(this, options);

  if (options.hasOwnProperty('default')){
    var defaults = options.default,
      fn = typeof defaults === 'function';
  }

  this.default = function(){
    return fn ? defaults() : defaults || {};
  };
};

SchemaObject.__proto__ = SchemaType;
SchemaObject.type = SchemaObject.prototype.type = Object;

/**
 * Inherits from SchemaType.
 */

SchemaObject.prototype.__proto__ = SchemaType.prototype;

/**
 * Compares data.
 *
 * @param {Object} data
 * @param {Object} value
 * @return {Boolean}
 * @api public
 */

SchemaObject.prototype.compare = function(data, value){
  return JSON.stringify(data) === JSON.stringify(value);
};