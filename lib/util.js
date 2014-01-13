/**
* Utilties.
*
* @class util
* @static
* @module warehouse
*/

/**
* Copies an array.
*
* @method copy
* @param {Array} arr
* @return {Array}
* @static
*/

var copy = exports.copy = function(arr){
  return arr.slice();
};

/**
* Returns the given `arr` in reversed order.
*
* @method reverse
* @param {Array} arr
* @return {Array}
* @static
*/

exports.reverse = function(arr){
  arr = copy(arr);

  for (var left = 0, right = arr.length - 1; left < right; left++, right--){
    var temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
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
  arr = copy(arr);
  for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp);
  return arr;
};

/**
* Creates a duplicate-value-free version of the array.
*
* @method unique
* @param {Array} arr
* @return {Array}
* @static
*/

exports.unique = function(arr){
  var a = [],
    l = arr.length;

  for (var i = 0; i < l; i++){
    for (var j = i + 1; j < l; j++){
      if (arr[i] === arr[j]) j = ++i;
    }
    a.push(arr[i]);
  }

  return a;
};

/**
* Flattens a nested array.
*
* @method flatten
* @param {Array} arr
* @return {Array}
* @static
*/

exports.flatten = function(arr){
  arr = copy(arr);
  for (var i = 0, len = arr.length; i < len; i++){
    var item = arr[i];
    if (Array.isArray(item)){
      len += item.length - 1;
      [].splice.apply(arr, [i, 1].concat(item));
      i--;
    }
  }
  return arr;
};

/**
* Swaps elements in the array.
*
* @method _swap
* @param {Array} arr
* @param {Number} a
* @param {Number} b
* @private
*/

var _swap = function(arr, a, b){
  var tmp = arr[a];
  arr[a] = arr[b];
  arr[b] = tmp;
};

/**
* Quick sort.
*
* @method _quickSort
* @param {Array} arr
* @param {Number} left
* @param {Number} right
* @return {Array}
* @private
*/

var _quickSort = function(arr, left, right){
  if (right <= left) return;

  var pivotIndex = parseInt((left + right) / 2),
    pivot = arr[pivotIndex];

  _swap(arr, pivotIndex, right);
  var swapIndex = left;

  for (var i = left; i < right; i++){
    if (arr[i] <= pivot){
      _swap(arr, i, swapIndex++);
    }
  }

  _swap(arr, swapIndex, right);
  _quickSort(arr, left, swapIndex - 1);
  _quickSort(arr, swapIndex + 1, right);

  return arr;
};

/**
* Sorts an array.
*
* @method sort
* @param {Array} arr
* @return {Array}
* @static
*/

exports.sort = function(arr){
  return _quickSort(copy(arr), 0, arr.length - 1);
};

/**
* Generates a unique ID.
*
* @method uid
* @param {Number} length
* @return {String}
* @static
*/

exports.uid = function(length){
  var txt = '0123456789abcdefghijklmnopqrstuvwxyz',
    total = txt.length,
    result = '';

  for (var i = 0; i < length; i++){
    result += txt[parseInt(Math.random() * total)];
  }

  return result;
};

/**
* Compares 2 arrays.
*
* @method compare
* @param {Array} a
* @param {Array} b
* @return {Boolean}
* @static
*/

var compare = exports.compare = function(a, b){
  if (!a || !b) return false;
  if (a.length != b.length) return false;

  for (var i = 0, len = a.length; i < len; i++){
    if (a[i] instanceof Array && b[i] instanceof Array){
      if (!compare(a[i], b[i])) return false;
    } else if (a[i] != b[i]){
      return false;
    }
  }

  return true;
};

/**
* Gets a property in an object.
*
* @method getProperty
* @param {Object} obj
* @param {String} result
* @return {Any}
* @static
*/

exports.getProperty = function(obj, key){
  key = key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');

  var split = key.split('.'),
    result = obj[split[0]];

  for (var i = 1, len = split.length; i < len; i++){
    result = result[split[i]];
  }

  return result;
};

/**
* Sets a property in an object.
*
* @method setProperty
* @param {Object} obj
* @param {String} key
* @param {Any} data
* @static
*/

exports.setProperty = function(obj, key, data){
  key = key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');

  var split = key.split('.'),
    cursor = obj;

  for (var i = 0, len = split.length - 1; i < len; i++){
    var name = split[i];
    cursor = cursor[name] = cursor[name] || {};
  }

  cursor[split[i]] = data;
};

/**
* Deletes a property in an object.
*
* @method deleteProperty
* @param {Object} obj
* @param {String} key
* @static
*/

exports.deleteProperty = function(obj, key){
  key = key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');

  var split = key.split('.'),
    cursor = obj;

  for (var i = 0, len = split.length - 1; i < len; i++){
    var name = split[i];

    if (cursor.hasOwnProperty(name)){
      cursor = cursor[name];
    } else {
      return;
    }
  }

  delete cursor[split[i]];
};

/**
* Get the correct type of an object.
*
* @method getType
* @param {Any} obj
* @return {String}
* @static
*/

exports.getType = function(obj){
  var type = Object.prototype.toString.call(obj);
  return type.substring(8, type.length - 1);
};