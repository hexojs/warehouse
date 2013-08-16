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

SchemaArray.__proto__ = SchemaType;
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

SchemaArray.prototype.compare = function(data, value){
  return util.compare(data, value);
};

SchemaArray.prototype.q$length = SchemaArray.prototype.q$size = function(data, value){
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

SchemaArray.prototype.q$in = function(data, value){
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

SchemaArray.prototype.q$nin = function(data, value){
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

SchemaArray.prototype.q$all = function(data, value){
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

SchemaArray.prototype.u$push = function(data, value){
  if (!data) return [].concat(value);

  return [].concat(data, value);
};

SchemaArray.prototype.u$unshift = function(data, value){
  if (!data) return [].concat(value);

  return [].concat(value, data);
};

SchemaArray.prototype.u$pull = function(data, value){
  if (!data) return;

  if (Array.isArray(value)){
    return _.difference(data, value);
  } else {
    return _.without(data, value);
  }
};

SchemaArray.prototype.u$shift = function(data, value){
  if (!data) return;

  value = value === true ? 1 : +value;

  if (value > 0){
    return data.slice(value);
  } else {
    return data.slice(0, data.length + value);
  }
};

SchemaArray.prototype.u$pop = function(data, value){
  if (!data) return;

  value = value === true ? 1 : +value;

  if (value > 0){
    return data.slice(0, data.length - value);
  } else {
    return data.slice(-value, data.length);
  }
};

SchemaArray.prototype.u$addToSet = function(data, value){
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