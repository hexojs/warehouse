'use strict';

exports.shuffle = array => {
  if (!Array.isArray(array)) throw new TypeError('array must be an Array!');
  const $array = array.slice();
  const { length } = $array;
  const { random, floor } = Math;

  for (let i = 0; i < length; i++) {
    // @see https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L6718
    // @see https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L3884
    const rand = i + floor(random() * (length - i));

    const temp = $array[i];
    $array[i] = $array[rand];
    $array[rand] = temp;
  }

  return $array;
};

function extractPropKey(key) {
  return key.split('.');
}

exports.getProp = (obj, key) => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  const token = extractPropKey(key);
  let result = obj[token.shift()];
  const len = token.length;

  if (!len) return result;

  for (let i = 0; i < len; i++) {
    result = result[token[i]];
  }

  return result;
};

exports.setProp = (obj, key, value) => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  const token = extractPropKey(key);
  const lastKey = token.pop();
  const len = token.length;

  if (!len) {
    obj[lastKey] = value;
    return;
  }

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor[lastKey] = value;
};

exports.delProp = (obj, key) => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  const token = extractPropKey(key);
  const lastKey = token.pop();
  const len = token.length;

  if (!len) {
    delete obj[lastKey];
    return;
  }

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];

    if (cursor[name]) {
      cursor = cursor[name];
    } else {
      return;
    }
  }

  delete cursor[lastKey];
};

exports.setGetter = (obj, key, fn) => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');
  if (typeof fn !== 'function') throw new TypeError('fn must be a function!');

  const token = extractPropKey(key);
  const lastKey = token.pop();
  const len = token.length;

  if (!len) {
    obj.__defineGetter__(lastKey, fn);
    return;
  }

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor.__defineGetter__(lastKey, fn);
};

exports.arr2obj = (arr, value) => {
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  const obj = {};
  let i = arr.length;

  while (i--) {
    obj[arr[i]] = value;
  }

  return obj;
};

exports.reverse = arr => {
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  const len = arr.length;

  if (!len) return arr;

  for (let left = 0, right = len - 1; left < right; left++, right--) {
    const tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
  }

  return arr;
};

function parseArgs(args) {
  if (typeof args !== 'string') return args;

  const arr = args.split(' ');
  const result = {};

  for (let i = 0, len = arr.length; i < len; i++) {
    const key = arr[i];

    switch (key[0]) {
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

exports.parseArgs = (orderby, order) => {
  let result;

  if (order) {
    result = {};
    result[orderby] = order;
  } else if (typeof orderby === 'string') {
    result = parseArgs(orderby);
  } else {
    result = orderby;
  }

  return result;
};
