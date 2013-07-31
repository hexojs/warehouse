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

SchemaObject.compare = function(data, value){
  return JSON.stringify(data) === JSON.stringify(value);
};

/**
 * Inherits query operators from SchemaType.
 */

SchemaObject.queryOperators = _.clone(SchemaType.queryOperators);

/**
 * Inherits update operators from SchemaType.
 */

SchemaObject.updateOperators = _.clone(SchemaType.updateOperators);