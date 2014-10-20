'use strict';

var util = require('util'),
  fast = require('fast.js');

exports.inherits = util.inherits;

function extractPropKey(key){
  return key.split('.');
}

exports.getProp = function(obj, key){
  var token = extractPropKey(key),
    result = obj[token.shift()],
    len = token.length;

  if (!len) return result;

  for (var i = 0; i < len; i++){
    result = result[token[i]];
  }

  return result;
};

exports.setProp = function(obj, key, value){
  var token = extractPropKey(key),
    cursor = obj,
    lastKey = token.pop();

  for (var i = 0, len = token.length; i < len; i++){
    var name = token[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor[lastKey] = value;
};

exports.delProp = function(obj, key){
  var token = extractPropKey(key),
    cursor = obj,
    lastKey = token.pop();

  for (var i = 0, len = token.length; i < len; i++){
    var name = token[i];

    if (typeof cursor[name] === 'object'){
      cursor = cursor[name];
    } else {
      return;
    }
  }

  delete cursor[lastKey];
};

exports.arr2obj = function(arr, value){
  var obj = {},
    i = arr.length;

  while (i--){
    obj[arr[i]] = value;
  }

  return obj;
};

exports.arrayEqual = function(a, b){
  var i = a.length;

  if (i !== b.length) return false;

  while (i--){
    if (a[i] !== b[i]) return false;
  }

  return true;
};

exports.deepCloneNoPrototype = function deepCloneNoPrototype(input){
  if (typeof input !== 'object') return input;

  var i, len, cloned;

  if (Array.isArray(input)){
    len = input.length;
    cloned = new Array(len);

    if (!len) return cloned;

    for (i = 0; i < len; i++){
      cloned[i] = deepCloneNoPrototype(input[i]);
    }
  } else {
    var keys = Object.keys(input),
      key;

    cloned = {};
    len = keys.length;

    if (!len) return cloned;

    for (i = 0; i < len; i++){
      key = keys[i];
      cloned[key] = deepCloneNoPrototype(input[key]);
    }
  }

  return cloned;
};

exports.contains = function(arr, input){
  var i = arr.length;

  if (!i) return false;

  while (i--){
    if (arr[i] === input) return true;
  }

  return false;
};

exports.reverse = function(arr){
  var len = arr.length,
    tmp;

  if (!len) return arr;

  for (var left = 0, right = len - 1; left < right; left++, right--){
    tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
  }

  return arr;
};

exports.shuffle = function(arr){
  var len = arr.length,
    i, tmp;

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

  var arr = args.split(' '),
    result = {},
    key;

  for (var i = 0, len = arr.length; i < len; i++){
    key = arr[i];

    if (key[0] === '-'){
      result[key.slice(1)] = -1;
    } else {
      result[key] = 1;
    }
  }

  return result;
}

exports.parseArgs = parseArgs;

exports.parseSortArgs = function(orderby, order){
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

exports.callbackWrapper = function(cb){
  if (typeof cb !== 'function') return;

  return function(err, result){
    if (cb.length < 2){
      if (err != null) throw err;
      cb(result);
    } else {
      cb(err, result);
    }
  };
};