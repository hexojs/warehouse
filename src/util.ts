function extractPropKey(key) {
  return key.split('.');
}

function _parseArgs(args) {
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


export function shuffle(array) {
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
}

export function getProp(obj, key) {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    return obj[key];
  }

  const token = extractPropKey(key);
  let result = obj;
  const len = token.length;

  for (let i = 0; i < len; i++) {
    result = result[token[i]];
  }

  return result;
}

export function setProp(obj, key, value) {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    obj[key] = value;
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop();
  const len = token.length;

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor[name] = cursor[name] || {};
    cursor = cursor[name];
  }

  cursor[lastKey] = value;
}

export function delProp(obj, key) {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    delete obj[key];
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop();
  const len = token.length;

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
}

export function setGetter(obj, key, fn) {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');
  if (typeof fn !== 'function') throw new TypeError('fn must be a function!');

  if (!key.includes('.')) {
    obj.__defineGetter__(key, fn);
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop();
  const len = token.length;

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor[name] = cursor[name] || {};
    cursor = cursor[name];
  }

  cursor.__defineGetter__(lastKey, fn);
}

export function arr2obj(arr, value) {
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  const obj = {};
  let i = arr.length;

  while (i--) {
    obj[arr[i]] = value;
  }

  return obj;
}

export function reverse(arr) {
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  const len = arr.length;

  if (!len) return arr;

  for (let left = 0, right = len - 1; left < right; left++, right--) {
    const tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
  }

  return arr;
}

export function parseArgs(orderby, order) {
  let result;

  if (order) {
    result = {};
    result[orderby] = order;
  } else if (typeof orderby === 'string') {
    result = _parseArgs(orderby);
  } else {
    result = orderby;
  }

  return result;
}
