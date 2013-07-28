var SchemaType = require('../schematype');

var SchemaNumber = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaNumber.prototype.type = Number;

SchemaNumber.prototype.__proto__ = SchemaType.prototype;

SchemaNumber.prototype.checkRequired = function(value){
  return value instanceof Number || typeof value === 'number';
};

SchemaNumber.prototype.cast = function(value){
  if (value === null) return value;
  if (value === '') return null;
  if (value instanceof Number || typeof value === 'number') return value;
  if (!isNaN(+value)) return +value;

  return null;
};

var queryOperators = SchemaNumber.prototype.queryOperators = {
  lt: function(data, value){
    return data < value;
  },
  lte: function(data, value){
    return data <= value;
  },
  gt: function(data, value){
    return data > value;
  },
  gte: function(data, value){
    return data >= value;
  },
  ne: function(data, value){
    return data == null ? false : data != value;
  },
  in: function(data, value){
    for (var i = 0, len = value.length; i < len; i++){
      if (data === value[i]) return true;
    }

    return false;
  },
  nin: function(data, value){
    for (var i = 0, len = value.length; i < len; i++){
      if (data === value[i]) return false;
    }

    return true;
  }
};

queryOperators.max = queryOperators.lte;
queryOperators.min = queryOperators.gte;

SchemaNumber.prototype.updateOperators = {
  inc: function(data, value){
    if (!data) return +value;

    return data + +value;
  },
  dec: function(data, value){
    if (!data) return -+value;

    return data - +value;
  }
};