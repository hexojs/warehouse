/**
 * Module dependencies.
 */

var _ = require('lodash'),
  SchemaType = require('../schematype'),
  util = require('../util');

/**
 * Creates a new SchemaArray instance.
 *
 * @param {Object} [options]
 * @api public
 */

var SchemaArray = module.exports = function(options){
  options = options || {};

  SchemaType.call(this, options);

  if (options.hasOwnProperty('default')){
    var defaults = options.default,
      fn = typeof defaults === 'function';
  }

  this.default = function(){
    return fn ? defaults() : defaults || [];
  };
};

SchemaArray.type = SchemaArray.prototype.type = Array;

/**
 * Inherits from SchemaType.
 */

SchemaArray.prototype.__proto__ = SchemaType.prototype;

/**
 * Checks if the given `value` is an array.
 *
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaArray.prototype.checkRequired = function(value){
  return Array.isArray(value);
};

/**
 * Casts the given `value` to an array.
 *
 * @param {any} value
 * @return {Array}
 * @api public
 */

SchemaArray.prototype.cast = function(value){
  if (Array.isArray(value)){
    return value;
  } else {
    return [value];
  }
};

/**
 * Compares data.
 *
 * @param {Array} data
 * @param {Array} value
 * @return {Boolean}
 * @api public
 */

SchemaArray.compare = function(data, value){
  return util.compare(data, value);
};

/**
 * Inherits query operators from SchemaType.
 */

var queryOperators = SchemaArray.queryOperators = _.clone(SchemaType.queryOperators);

queryOperators.length = queryOperators.size = function(data, value){
  if (!data) return false;

  var length = data.length;

  if (_.isObject(value)){
    var match = true,
      keys = Object.keys(value);

    for (var i = 0, len = keys.length; i < len; i++){
      var key = keys[i],
        rule = value[key];

      switch (key){
        case '$lt':
          match = length < rule;
          break;

        case '$lte':
        case '$max':
          match = length <= rule;
          break;

        case '$gt':
          match = length > rule;
          break;

        case '$gte':
        case '$min':
          match = length >= rule;
          break;
      }

      if (!match) break;
    }

    return match;
  } else {
    return length == value;
  }
};

queryOperators.in = function(data, value){
  if (!data || !data.length) return false;
  if (!Array.isArray(value)) value = [value];

  var match = false;

  for (var i = 0, len = value.length; i < len; i++){
    if (data.indexOf(value[i]) > -1){
      match = true;
      break;
    }
  }

  return match;
};

queryOperators.nin = function(data, value){
  if (!data) return false;
  if (!Array.isArray(value)) value = [value];

  var match = true;

  for (var i = 0, len = value.length; i < len; i++){
    if (data.indexOf(value[i]) > -1){
      match = false;
      break;
    }
  }

  return match;
};

queryOperators.all = function(data, value){
  if (!data) return false;
  if (!Array.isArray(value)) value = [value];

  var match = true;

  for (var i = 0, len = value.length; i < len; i++){
    if (data.indexOf(value[i]) === -1){
      match = false;
      break;
    }
  }

  return match;
};

/**
 * Inherits update operators from SchemaType.
 */

var updateOperators = SchemaArray.updateOperators = _.clone(SchemaType.updateOperators);

updateOperators.push = function(data, value){
  if (!data) return [].concat(value);

  return [].concat(data, value);
};

updateOperators.unshift = function(data, value){
  if (!data) return [].concat(value);

  return [].concat(value, data);
};

updateOperators.pull = function(data, value){
  if (!data) return;

  if (Array.isArray(value)){
    return _.difference(data, value);
  } else {
    return _.without(data, value);
  }
};
updateOperators.shift = function(data, value){
  if (!data) return;

  value = value === true ? 1 : +value;

  if (value > 0){
    return data.slice(value);
  } else {
    return data.slice(0, data.length + value);
  }
};

updateOperators.pop = function(data, value){
  if (!data) return;

  value = value === true ? 1 : +value;

  if (value > 0){
    return data.slice(0, data.length - value);
  } else {
    return data.slice(-value, data.length);
  }
};

updateOperators.addToSet = function(data, value){
  if (!Array.isArray(value)) value = [value];
  if (!data) return value;

  var arr = data.slice();

  value.forEach(function(item){
    if (arr.indexOf(item) == -1){
      arr.push(item);
    }
  });

  return arr;
};