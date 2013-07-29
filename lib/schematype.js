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
  return value != null;
};

SchemaType.prototype.cast = function(value){
  return value;
};

SchemaType.prototype.save = function(value){
  return value;
};

SchemaType.compare = function(data, value){
  return data == value;
};

var queryOperators = SchemaType.queryOperators = {};

queryOperators.exists = queryOperators.exist = function(data, value){
  return (data != null) == value;
};

queryOperators.ne = function(data, value){
  return data != value;
};

queryOperators.lt = function(data, value){
  return data < value;
};

queryOperators.lte = queryOperators.max = function(data, value){
  return data <= value;
};

queryOperators.gt = function(data, value){
  return data > value;
};

queryOperators.gte = queryOperators.min = function(data, value){
  return data >= value;
};

queryOperators.in = function(data, value){
  for (var i = 0, len = value.length; i < len; i++){
    if (data === value[i]) return true;
  }

  return false;
};

queryOperators.nin = function(data, value){
  for (var i = 0, len = value.length; i < len; i++){
    if (data === value[i]) return false;
  }

  return true;
};

queryOperators.within = function(data, value){
  return data >= value[0] && data <= value[1];
};

queryOperators.without = function(data, value){
  return !(data >= value[0] && data <= value[1]);
};

queryOperators.where = function(data, value){
  return value(data);
};

SchemaType.updateOperators = {};