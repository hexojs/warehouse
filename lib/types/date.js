var SchemaType = require('../schematype');

var SchemaDate = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaDate.prototype.type = Date;

SchemaDate.prototype.__proto__ = SchemaType.prototype;

SchemaDate.prototype.checkRequired = function(value){
  return value instanceof Date;
};

SchemaDate.prototype.cast = function(value){
  if (value === null || value === '') return null;
  if (value instanceof Date) return value;

  if (value instanceof Number || typeof value === 'number'){
    return new Date(value);
  }

  if (!isNaN(+value)){
    return new Date(+value);
  }

  var date = new Date(value);

  if (date.toString() !== 'Invalid Date'){
    return date;
  } else {
    return null;
  }
};

var queryOperators = SchemaDate.prototype.queryOperators = {
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
  year: function(data, value){
    return data ? data.getFullYear() == value : false;
  },
  month: function(data, value){
    return data ? data.getMonth() == value - 1 : false;
  },
  day: function(data, value){
    return data ? data.getDate() == value : false;
  },
  ne: function(data, value){
    return data == null ? false : data.valueOf() === value.valueOf();
  }
};

queryOperators.max = queryOperators.lte;
queryOperators.min = queryOperators.gte;

SchemaDate.prototype.updateOperators = {
  inc: function(data, value){
    if (!data) return;

    return new Date(data.valueOf() + +value);
  },
  dec: function(data, value){
    if (!data) return;

    return new Date(data.valueOf() - +value);
  }
};