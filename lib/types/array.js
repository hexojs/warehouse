'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  fast = require('fast.js'),
  _ = require('lodash'),
  ValidationError = require('../error/validation');

function SchemaTypeArray(name, options){
  SchemaType.call(this, name, fast.assign({
    default: [],
    child: new SchemaType()
  }, options));
}

util.inherits(SchemaTypeArray, SchemaType);

SchemaTypeArray.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);
  if (value == null) return value;

  if (!Array.isArray(value)) value = [value];
  if (!value.length) return value;

  var child = this.options.child;

  for (var i = 0, len = value.length; i < len; i++){
    value[i] = child.cast(value[i], data);
  }

  return value;
};

SchemaTypeArray.prototype.validate = function(value_, data){
  var value = SchemaType.prototype.validate.call(this, value_, data);
  if (value instanceof Error) return value;

  if (!Array.isArray(value)) return new ValidationError('`' + value + '` is not a valid array');
  if (!value.length) return value;

  var child = this.options.child,
    result;

  for (var i = 0, len = value.length; i < len; i++){
    result = child.validate(value[i], data);

    if (result instanceof Error){
      return result;
    } else {
      value[i] = result;
    }
  }

  return value;
};

SchemaTypeArray.prototype.compare = function(a, b){
  var lenA = a.length,
    lenB = b.length,
    child = this.options.child,
    result;

  for (var i = 0, len = Math.min(lenA, lenB); i < len; i++){
    result = child.compare(a[i], b[i]);
    if (result !== 0) return result;
  }

  // Compare by length
  return lenA - lenB;
};

SchemaTypeArray.prototype.match = function(value, data){
  var lenA = value.length,
    lenB = data.length;

  if (lenA !== lenB) return false;

  var child = this.options.child;

  for (var i = 0; i < lenA; i++){
    if (!child.match(value[i], data[i])) return false;
  }

  return true;
};

SchemaTypeArray.prototype.q$size = function(value, query, data){
  return value.length === query;
};

SchemaTypeArray.prototype.q$length = SchemaTypeArray.prototype.q$size;

SchemaTypeArray.prototype.q$in = function(value, query, data){
  for (var i = 0, len = query.length; i < len; i++){
    if (util.contains(value, query[i])) return true;
  }

  return false;
};

SchemaTypeArray.prototype.q$nin = function(value, query, data){
  for (var i = 0, len = query.length; i < len; i++){
    if (util.contains(value, query[i])) return false;
  }

  return true;
};

SchemaTypeArray.prototype.q$all = function(value, query, data){
  for (var i = 0, len = query.length; i < len; i++){
    if (!util.contains(value, query[i])) return false;
  }

  return true;
};

SchemaTypeArray.prototype.u$push = function(value, update, data){
  return value.concat(update);
};

SchemaTypeArray.prototype.u$append = SchemaTypeArray.prototype.u$push;

SchemaTypeArray.prototype.u$unshift = function(value, update, data){
  return [].concat(update, value);
};

SchemaTypeArray.prototype.u$prepend = SchemaTypeArray.prototype.u$unshift;

SchemaTypeArray.prototype.u$pull = function(value, update, data){
  if (Array.isArray(update)){
    return _.difference(value, update);
  } else {
    return _.without(value, update);
  }
};

SchemaTypeArray.prototype.u$shift = function(value, update, data){
  if (update === true){
    return data.slice(1);
  } else {
    return data.slice(update);
  }
};

SchemaTypeArray.prototype.u$pop = function(value, update, data){
  var length = value.length;

  if (update === true){
    return data.slice(0, length - 1);
  } else {
    return data.slice(0, length - update);
  }
};

SchemaTypeArray.prototype.u$addToSet = function(value, update, data){
  var arr = [],
    item;

  for (var i = 0, len = update.length; i < len; i++){
    item = update[i];
    if (!util.contains(value, item)) arr.push(item);
  }

  return value.concat(arr);
};

module.exports = SchemaTypeArray;