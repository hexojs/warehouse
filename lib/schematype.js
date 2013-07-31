/**
 * Creates a new SchemaType instance.
 *
 * @param {Object} [options]
 * @api public
 */

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

/**
 * Validates a value.
 *
 * @param {any} value
 * @return {any}
 * @api public
 */

SchemaType.prototype.checkRequired = function(value){
  return value != null;
};

/**
 * Casts a value.
 *
 * @param {any} value
 * @return {any} value
 * @api public
 */

SchemaType.prototype.cast = function(value){
  return value;
};

/**
 * Transforms a value into JSON.
 *
 * @param {any} value
 * @return {any} value
 * @api public
 */

SchemaType.prototype.save = function(value){
  return value;
};

/**
 * Compares data.
 *
 * @param {any} data
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaType.compare = function(data, value){
  return data == value;
};

/**
 * Query operators.
 *
 * @api public
 */

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
  if (!Array.isArray(value)) value = [value];

  for (var i = 0, len = value.length; i < len; i++){
    if (data === value[i]) return true;
  }

  return false;
};

queryOperators.nin = function(data, value){
  if (!Array.isArray(value)) value = [value];

  for (var i = 0, len = value.length; i < len; i++){
    if (data === value[i]) return false;
  }

  return true;
};

var within = queryOperators.within = function(data, value){
  return data >= value[0] && data <= value[1];
};

queryOperators.without = function(data, value){
  return !within(data, value);
};

queryOperators.where = function(data, value){
  return value(data);
};

/**
 * Update operators.
 *
 * @api public
 */

SchemaType.updateOperators = {};