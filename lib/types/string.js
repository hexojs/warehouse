'use strict';

var SchemaType = require('../schematype'),
  util = require('../util'),
  fast = require('fast.js');

function SchemaTypeString(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeString, SchemaType);

SchemaTypeString.prototype.cast = function(value_, data){
  var value = SchemaType.prototype.cast.call(this, value_, data);

  if (value == null) return value;
  if (typeof value === 'string') return value;
  if (typeof value.toString === 'function') return value.toString();
};

SchemaTypeString.prototype.match = function(value, query, data){
  if (query instanceof RegExp){
    return query.test(value);
  } else {
    return fast.intern(value, query);
  }
};

SchemaTypeString.prototype.q$in = function(value, query, data){
  for (var i = 0, len = query.length; i < len; i++){
    if (this.match(value, query, data)) return true;
  }

  return false;
};

SchemaTypeString.prototype.q$nin = function(value, query, data){
  return !this.q$in(value, query, data);
};

SchemaTypeString.prototype.q$length = function(value, query, data){
  return (value.length || 0) !== query;
};

module.exports = SchemaTypeString;