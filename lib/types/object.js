var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
* SchemaType: Object
*
* @class Object
* @param {Object} [options]
* @constructor
* @extends Warehouse.SchemaType
* @namespace Warehouse.SchemaType
* @module warehouse
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

/**
* @property type
* @type Object
* @static
*/

SchemaObject.type = SchemaObject.prototype.type = Object;

SchemaObject.__proto__ = SchemaType;
SchemaObject.prototype.__proto__ = SchemaType.prototype;

/**
* Compares data.
*
* @method compare
* @param {Object} data
* @param {Object} value
* @return {Boolean}
*/

SchemaObject.prototype.compare = function(data, value){
  return JSON.stringify(data) === JSON.stringify(value);
};