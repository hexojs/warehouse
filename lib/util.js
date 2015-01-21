/**
 * Utilities.
 *
 * @class util
 * @static
 * @module warehouse
 */

'use strict';

var util = require('util');

exports.inherits = util.inherits;
exports.isDate = util.isDate;

function extractPropKey(key){
  return key.split('.');
}

/**
 * Returns a nested property in an object.
 *
 * @method getProp
 * @param {Object} obj
 * @param {String} key
 * @return {*}
 * @static
 */
exports.getProp = function(obj, key){
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  var token = extractPropKey(key);
  var result = obj[token.shift()];
  var len = token.length;

  if (!len) return result;

  for (var i = 0; i < len; i++){
    result = result[token[i]];
  }

  return result;
};

/**
 * Sets a nested property in an object.
 *
 * @method setProp
 * @param {Object} obj
 * @param {String} key
 * @param {*} value
 * @static
 */
exports.setProp = function(obj, key, value){
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  var token = extractPropKey(key);
  var lastKey = token.pop();
  var len = token.length;

  if (!len){
    obj[lastKey] = value;
    return;
  }

  var cursor = obj;
  var name;

  for (var i = 0; i < len; i++){
    name = token[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor[lastKey] = value;
};

/**
 * Deletes a nested property in an object.
 *
 * @method delProp
 * @param {Object} obj
 * @param {String} key
 * @static
 */
exports.delProp = function(obj, key){
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  var token = extractPropKey(key);
  var lastKey = token.pop();
  var len = token.length;

  if (!len){
    delete obj[lastKey];
    return;
  }

  var cursor = obj;
  var name;

  for (var i = 0; i < len; i++){
    name = token[i];

    if (cursor[name]){
      cursor = cursor[name];
    } else {
      return;
    }
  }

  delete cursor[lastKey];
};

/**
 * Sets a getter in an object.
 *
 * @method setGetter
 * @param {Object} obj
 * @param {String} key
 * @param {Function} fn
 */
exports.setGetter = function(obj, key, fn){
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');
  if (typeof fn !== 'function') throw new TypeError('fn must be a function!');

  var token = extractPropKey(key);
  var lastKey = token.pop();
  var len = token.length;

  if (!len){
    obj.__defineGetter__(lastKey, fn);
    return;
  }

  var cursor = obj;
  var name;

  for (var i = 0; i < len; i++){
    name = token[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor.__defineGetter__(lastKey, fn);
};

/**
 * Transforms an array to a object.
 *
 * @method arr2obj
 * @param {Array} arr
 * @param {*} [value]
 * @return {Object}
 * @static
 */
exports.arr2obj = function(arr, value){
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  var obj = {};
  var i = arr.length;

  while (i--){
    obj[arr[i]] = value;
  }

  return obj;
};

/**
 * Checks the equality of an array.
 *
 * @method arrayEqual
 * @param {Array} a
 * @param {Array} b
 * @return {Boolean}
 * @static
 */
exports.arrayEqual = function(a, b){
  if (!Array.isArray(a)) throw new TypeError('a must be an array!');
  if (!Array.isArray(b)) throw new TypeError('b must be an array!');

  var i = a.length;

  if (i !== b.length) return false;

  while (i--){
    if (a[i] !== b[i]) return false;
  }

  return true;
};

/**
 * Clones an array.
 *
 * @method cloneArray
 * @param {Array} arr
 * @return {Array}
 */
function cloneArray(arr){
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  var len = arr.length;
  var result = new Array(len);

  for (var i = 0; i < len; i++){
    result[i] = arr[i];
  }

  return result;
}

exports.cloneArray = cloneArray;

/**
 * Checks whether an array contains a specified value.
 *
 * @method contains
 * @param {Array} arr
 * @param {*} input
 * @return {Boolean}
 * @static
 */
exports.contains = function(arr, input){
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  var i = arr.length;

  if (!i) return false;

  while (i--){
    if (arr[i] === input) return true;
  }

  return false;
};

/**
 * Reverses an array.
 *
 * @method reverse
 * @param {Array} arr
 * @return {Array}
 * @static
 */
exports.reverse = function(arr){
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  var len = arr.length;
  var tmp;

  if (!len) return arr;

  for (var left = 0, right = len - 1; left < right; left++, right--){
    tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
  }

  return arr;
};

/**
 * Shuffles an array.
 *
 * @method shuffle
 * @param {Array} arr
 * @return {Array}
 * @static
 */
exports.shuffle = function(arr){
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  var len = arr.length;
  var i, tmp;

  if (!len) return arr;

  while (len){
    i = Math.random() * len | 0;
    tmp = arr[--len];
    arr[len] = arr[i];
    arr[i] = tmp;
  }

  return arr;
};

function parseArgs(args){
  if (typeof args !== 'string') return args;

  var arr = args.split(' ');
  var result = {};
  var key;

  for (var i = 0, len = arr.length; i < len; i++){
    key = arr[i];

    switch (key[0]){
      case '+':
        result[key.slice(1)] = 1;
        break;

      case '-':
        result[key.slice(1)] = -1;
        break;

      default:
        result[key] = 1;
    }
  }

  return result;
}

/**
 * Parse string arguments. For example:
 *
 * ``` js
 * parseArgs('name') // {name: 1}
 * parseArgs('name -date') // {name: 1, date: -1}
 * parseArgs({name: 1, date: -1}) {name: 1, date: -1}
 * ```
 *
 * @method parseArgs
 * @param {String|Object} orderby
 * @param {String|Number} [order]
 * @return {Object}
 * @static
 */
exports.parseArgs = function(orderby, order){
  var result;

  if (order){
    result = {};
    result[orderby] = order;
  } else if (typeof orderby === 'string'){
    result = parseArgs(orderby);
  } else {
    result = orderby;
  }

  return result;
};

/**
 * Assigns enumerable properties of objects to the first object. Properties
 * which exist will be overwritten by next objects.
 *
 * @method extend
 * @param {Object} target
 * @return {Object}
 */
exports.extend = function(target){
  var length = arguments.length;
  var arg, key;

  for (var i = 1; i < length; i++){
    arg = arguments[i];

    if (typeof arg === 'object'){
      for (key in arg){
        target[key] = arg[key];
      }
    }
  }

  return target;
};