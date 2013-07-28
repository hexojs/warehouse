var SchemaType = module.exports = function(options){
  options = options || {};

  if (options.hasOwnProperty('default')){
    var defaults = options.default,
      fn = typeof defaults === 'function';

    this.default = function(){
      return fn ? defaults() : defaults;
    };
  }

  this.required = !!options.required;
};

SchemaType.prototype.checkRequired = function(value){
  return true;
};

SchemaType.prototype.cast = function(value){
  return value;
};

SchemaType.prototype.compare = function(data, value){
  return data == value;
};

SchemaType.prototype.queryOperators = {};
SchemaType.prototype.updateOperators = {};