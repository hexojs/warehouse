var copy = exports.copy = function(arr){
  return arr.slice();
};

exports.reverse = function(arr){
  arr = copy(arr);
  for (var left = 0, right = arr.length - 1; left < right; left++, right--){
    var temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
  }
  return arr;
};

exports.shuffle = function(arr){
  arr = copy(arr);
  for (var i, tmp, n = arr.length; n; i = Math.floor(Math.random() * n), tmp = arr[--n], arr[n] = arr[i], arr[i] = tmp);
  return arr;
};

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