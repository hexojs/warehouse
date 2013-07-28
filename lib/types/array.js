var _ = require('lodash'),
  SchemaType = require('../schematype');

var SchemaArray = module.exports = function(options){
  options = options || {};

  SchemaType.call(this, options);

  if (options.hasOwnProperty('default')){
    var defaults = options.default,
      fn = typeof defaults === 'function';
  }

  this.default = function(){
    return fn ? defaults() : defaults || [];
  };
};

SchemaArray.prototype.type = Array;

SchemaArray.prototype.__proto__ = SchemaType.prototype;

SchemaArray.prototype.checkRequired = function(value){
  return value && value.length;
};

SchemaArray.prototype.cast = function(value){
  if (Array.isArray(value)){
    return value;
  } else {
    return [value];
  }
};

var queryOperators = SchemaArray.prototype.queryOperators = {
  length: function(data, value){
    if (!data) return false;

    var length = data.length;

    if (_.isObject(value)){
      var match = true;

      for (var i in value){
        var rule = value[i];

        switch (rule){
          case '$lt':
            match = length < rule;
            break;

          case '$lte':
          case '$max':
            match = length < rule;
            break;

          case '$gt':
            match = length > rule;
            break;

          case '$gte':
          case '$min':
            match = length >= rule;
            break;
        }

        if (!match) break;
      }

      return match;
    } else {
      return length == value;
    }
  },
  in: function(data, value){
    if (!data) return false;
    if (!Array.isArray(value)) value = [value];

    var match = false;

    for (var i = 0, len = value.length; i < len; i++){
      if (data.indexOf(value[i]) > -1){
        match = true;
        break;
      }
    }

    return match;
  },
  nin: function(data, value){
    if (!data) return false;
    if (!Array.isArray(value)) value = [value];

    var match = true;

    for (var i = 0, len = value.length; i < len; i++){
      if (data.indexOf(value[i]) > -1){
        match = false;
        break;
      }
    }

    return match;
  },
  all: function(data, value){
    if (!data) return false;
    if (!Array.isArray(value)) value = [value];

    var match = true;

    for (var i = 0, len = value.length; i < len; i++){
      if (data.indexOf(value[i]) === -1){
        match = false;
        break;
      }
    }

    return match;
  }
};

queryOperators.size = queryOperators.length;

SchemaArray.prototype.updateOperators = {
  push: function(data, value){
    if (!data) return [].concat(value);

    return data.concat(value);
  },
  unshift: function(data, value){
    if (!data) return [].concat(value);

    return value.concat(data);
  },
  pull: function(data, value){
    if (!data) return;

    if (Array.isArray(value)){
      return _.difference(data, value);
    } else {
      return _.without(data, value);
    }
  },
  shift: function(data, value){
    if (!data) return;

    value = value === true ? 1 : +value;

    if (value > 0){
      return data.slice(value);
    } else {
      return data.slice(0, data.length + value);
    }
  },
  pop: function(data, value){
    if (!data) return;

    value = value === true ? 1 : +value;

    if (value > 0){
      return data.slice(0, data.length - value);
    } else {
      return data.slice(-value, data.length);
    }
  },
  addToSet: function(data, value){
    if (!Array.isArray(value)) value = [value];
    if (!data) return value;

    value.forEach(function(item){
      if (data.indexOf(item) == -1){
        data.push(item);
      }
    });

    return data;
  }
};