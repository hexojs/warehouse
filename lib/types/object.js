var SchemaType = require('../schematype');

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

SchemaObject.prototype.type = Object;

SchemaObject.prototype.__proto__ = SchemaType.prototype;