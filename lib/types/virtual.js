'use strict';

var SchemaType = require('../schematype'),
  util = require('../util');

function SchemaTypeVirtual(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeVirtual, SchemaType);

SchemaTypeVirtual.prototype.get = function(fn){
  if (typeof fn !== 'function') throw new TypeError('Getter must be a function!');

  this.getter = fn;
};

SchemaTypeVirtual.prototype.set = function(fn){
  if (typeof fn !== 'function') throw new TypeError('Setter must be a function');

  this.setter = fn;
};

SchemaTypeVirtual.prototype.cast = function(value, data){
  if (typeof this.getter === 'function'){
    return this.getter.call(data);
  }
};

SchemaTypeVirtual.prototype.validate = function(value, data){
  if (typeof this.setter === 'function'){
    this.setter.call(data);
  }
};

module.exports = SchemaTypeVirtual;