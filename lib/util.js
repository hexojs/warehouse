'use strict';

var util = require('util');

exports.inherits = util.inherits;

function extractPropKey(key){
  return key.split('.');
}

exports.getProp = function getProp(obj, key){
  var token = extractPropKey(key),
    result = obj[token.shift()],
    len = token.length;

  if (!len) return result;

  for (var i = 0; i < len; i++){
    result = result[token[i]];
  }

  return result;
};

exports.setProp = function setProp(obj, key, value){
  var token = extractPropKey(key),
    cursor = obj,
    lastKey = token.pop();

  for (var i = 0, len = token.length; i < len; i++){
    var name = token[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor[lastKey] = value;
};

exports.delProp = function delProp(obj, key){
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

exports.arr2obj = function arr2obj(arr, value){
  var obj = {},
    i = arr.length;

  while (i--){
    obj[arr[i]] = value;
  }

  return obj;
};

exports.arrayEqual = function arrayEqual(a, b){
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

exports.contains = function contains(arr, input){
  var i = arr.length;

  if (!i) return false;

  while (i--){
    if (arr[i] === input) return true;
  }

  return false;
};