'use strict';
exports.shuffle = function (array) {
    if (!Array.isArray(array))
        throw new TypeError('array must be an Array!');
    var $array = array.slice();
    var length = $array.length;
    var random = Math.random, floor = Math.floor;
    for (var i = 0; i < length; i++) {
        // @see https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L6718
        // @see https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L3884
        var rand = i + floor(random() * (length - i));
        var temp = $array[i];
        $array[i] = $array[rand];
        $array[rand] = temp;
    }
    return $array;
};
function extractPropKey(key) {
    return key.split('.');
}
exports.getProp = function (obj, key) {
    if (typeof obj !== 'object')
        throw new TypeError('obj must be an object!');
    if (!key)
        throw new TypeError('key is required!');
    if (!key.includes('.')) {
        return obj[key];
    }
    var token = extractPropKey(key);
    var result = obj;
    var len = token.length;
    for (var i = 0; i < len; i++) {
        result = result[token[i]];
    }
    return result;
};
exports.setProp = function (obj, key, value) {
    if (typeof obj !== 'object')
        throw new TypeError('obj must be an object!');
    if (!key)
        throw new TypeError('key is required!');
    if (!key.includes('.')) {
        obj[key] = value;
        return;
    }
    var token = extractPropKey(key);
    var lastKey = token.pop();
    var len = token.length;
    var cursor = obj;
    for (var i = 0; i < len; i++) {
        var name_1 = token[i];
        cursor[name_1] = cursor[name_1] || {};
        cursor = cursor[name_1];
    }
    cursor[lastKey] = value;
};
exports.delProp = function (obj, key) {
    if (typeof obj !== 'object')
        throw new TypeError('obj must be an object!');
    if (!key)
        throw new TypeError('key is required!');
    if (!key.includes('.')) {
        delete obj[key];
        return;
    }
    var token = extractPropKey(key);
    var lastKey = token.pop();
    var len = token.length;
    var cursor = obj;
    for (var i = 0; i < len; i++) {
        var name_2 = token[i];
        if (cursor[name_2]) {
            cursor = cursor[name_2];
        }
        else {
            return;
        }
    }
    delete cursor[lastKey];
};
exports.setGetter = function (obj, key, fn) {
    if (typeof obj !== 'object')
        throw new TypeError('obj must be an object!');
    if (!key)
        throw new TypeError('key is required!');
    if (typeof fn !== 'function')
        throw new TypeError('fn must be a function!');
    if (!key.includes('.')) {
        obj.__defineGetter__(key, fn);
        return;
    }
    var token = extractPropKey(key);
    var lastKey = token.pop();
    var len = token.length;
    var cursor = obj;
    for (var i = 0; i < len; i++) {
        var name_3 = token[i];
        cursor[name_3] = cursor[name_3] || {};
        cursor = cursor[name_3];
    }
    cursor.__defineGetter__(lastKey, fn);
};
exports.arr2obj = function (arr, value) {
    if (!Array.isArray(arr))
        throw new TypeError('arr must be an array!');
    var obj = {};
    var i = arr.length;
    while (i--) {
        obj[arr[i]] = value;
    }
    return obj;
};
exports.reverse = function (arr) {
    if (!Array.isArray(arr))
        throw new TypeError('arr must be an array!');
    var len = arr.length;
    if (!len)
        return arr;
    for (var left = 0, right = len - 1; left < right; left++, right--) {
        var tmp = arr[left];
        arr[left] = arr[right];
        arr[right] = tmp;
    }
    return arr;
};
function parseArgs(args) {
    if (typeof args !== 'string')
        return args;
    var arr = args.split(' ');
    var result = {};
    for (var i = 0, len = arr.length; i < len; i++) {
        var key = arr[i];
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
exports.parseArgs = function (orderby, order) {
    var result;
    if (order) {
        result = {};
        result[orderby] = order;
    }
    else if (typeof orderby === 'string') {
        result = parseArgs(orderby);
    }
    else {
        result = orderby;
    }
    return result;
};
