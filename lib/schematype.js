'use strict';

var _ = require('lodash'),
  fast = require('fast.js'),
  util = require('./util'),
  ValidationError = require('./error/validation');

function SchemaType(name, options){
  this.name = name || '';

  this.options = fast.assign({
    required: false
  }, options);

  var default_ = this.options.default;

  if (typeof default_ === 'function'){
    this.default = default_;
  } else {
    this.default = function(){
      return default_;
    };
  }
}

SchemaType.prototype.cast = function(value, data){
  if (value == null && this.default != null){
    return this.default();
  } else {
    return value;
  }
};

SchemaType.prototype.validate = function(value, data){
  if (this.options.required && value == null){
    return new ValidationError('`' + this.name + '` is required!');
  }

  return value;
};

SchemaType.prototype.compare = function(a, b){
  if (a > b){
    return 1;
  } else if (a < b){
    return -1;
  } else {
    return 0;
  }
};

SchemaType.prototype.parse = function(value, data){
  return value;
};

SchemaType.prototype.value = function(value, data){
  return value;
};

SchemaType.prototype.match = function(value, query, data){
  return value === query;
};

SchemaType.prototype.q$exist = function(value, query, data){
  return (value != null) == query;
};

SchemaType.prototype.q$exists = SchemaType.prototype.q$exist;

SchemaType.prototype.q$ne = function(value, query, data){
  return !this.match(value, query, data);
};

SchemaType.prototype.q$lt = function(value, query, data){
  return value < query;
};

SchemaType.prototype.q$lte = function(value, query, data){
  return value <= query;
};

SchemaType.prototype.q$gt = function(value, query, data){
  return value > query;
};

SchemaType.prototype.q$gte = function(value, query, data){
  return value >= query;
};

SchemaType.prototype.q$where = function(value, query, data){
  return query(value, data);
};

SchemaType.prototype.q$in = function(value, query, data){
  return util.contains(query, value);
};

SchemaType.prototype.q$nin = function(value, query, data){
  return !util.contains(query, value);
};

SchemaType.prototype.u$set = function(value, update, data){
  return update;
};

SchemaType.prototype.u$unset = function(value, update, data){
  return update ? undefined : value;
};

module.exports = SchemaType;