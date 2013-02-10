var Schema = module.exports = function(schema){
  var _schema = this._schema = {};
  this._virtuals = {};
  this.methods = {};

  for (var i in schema){
    _schema[i] = _createSchema(schema[i]);
  }
};

var _createSchema = function(val){
  var type = val.type || (val.constructor === Function ? val : val.constructor),
    obj = {type: type};

  if (val.default){
    obj.default = val.default;
  } else {
    switch (type){
      case String:
        obj.default = '';
        break;

      case Date:
        obj.default = Date.now;
        break;

      case Boolean:
        obj.default = true;
        break;

      case Number:
        obj.default = 0;
        break;

      case Array:
        obj.default = [];
        break;

      case Object:
        obj.default = {};
        break;
    }
  }

  switch (type){
    case Array:
      var length = val.length;
      if (length){
        var nested = [];
        for (var i=0; i<length; i++){
          nested.push(_createSchema(val[i]));
        }
        obj.nested = nested;
      }
      break;

    case Object:
      var keys = Object.keys(val),
        length = keys.length;
      if (length){
        var nested = {};
        for (var i=0; i<length; i++){
          var item = keys[i];
          nested[item] = _createSchema(val[item]);
        }
        obj.nested = nested;
      }
      break;
  }

  return obj;
};

Schema.prototype.virtual = function(name){
  var virtual = this._virtuals[name] = this._virtuals[name] || new Virtual();
  return virtual;
};

var _inputSchema = function(schema, obj){
  var type = schema.type;

  switch (type){
    case String:
      if (obj == null || typeof obj === 'undefined'){
        obj = '';
      } else {
        obj = obj.toString();
      }
      break;

    case Number:
      if (obj == null || typeof obj === 'undefined'){
        obj = 0;
      } else {
        obj = +obj;
      }
      break;

    case Date:
      if (_.isDate(obj)){
        obj = obj.toISOString();
      } else {
        var date = new Date(obj);
        if (_.isNan(date.getTime())){
          obj = new Date().toISOString();
        } else {
          obj = date.toISOString();
        }
      }
      break;

    case Boolean:
      obj = !!obj;
      break;

    case Array:
      if (!_.isArray(obj)){
        if (_.isObject(obj)){
          obj = _.toArray(obj);
        } else {
          obj = [obj];
        }
      }
      var nested = schema.nested,
        lastNested;
      if (nested){
        for (var i=0, len=obj.length; i<len; i++){
          var currentNested = nested[i];
          if (currentNested) lastNested = currentNested;
          obj[i] = _inputSchema(lastNested, obj[i]);
        }
      }
      break;

    case Object:
      var nested = schema.nested;
      if (nested){
        for (var i in nested){
          obj[i] = _inputSchema(nested[i], obj[i]);
        }
      }
      break;
  }

  return obj;
};

Schema.prototype.save = function(data){
  var schema = this._schema,
    virtuals = this._virtuals;

  for (var i in schema){
    var item = schema[i],
      defaultVal = item.default;

    if (data.hasOwnProperty(i)){
      data[i] = _createSchema(item, data[i]);
    } else if (defaultVal != null && typeof defaultVal !== 'undefined'){
      data[i] = _createSchema(item, _.isFunction(defaultVal) ? defaultVal() : defaultVal);
    }
  }

  for (var j in virtuals){
    var item = virtuals[j];
    if (item.hasOwnProperty('setter')){
      item.setter.call(data);
      delete data[j];
    }
  }

  return data;
};

var _outputSchema = function(schema, obj){
  var type = schema.type;

  switch (type){
    case Date:
      obj = new Date(obj);
      break;

    case Array:
      var nested = schema.nested,
        lastNested;
      if (nested){
        for (var i=0, len=obj.length; i<len; i++){
          var currentNested = nested[i];
          if (currentNested) lastNested = currentNested;
          obj[i] = _outputSchema(lastNested, obj[i]);
        }
      }
      break;

    case Object:
      var nested = schema.nested;
      if (nested){
        for (var i in nested){
          obj[i] = _outputSchema(nested[i], obj[i]);
        }
      }
      break;
  }
};

Schema.prototype.restore = function(data){
  var schema = this._schema,
    virtuals = this._virtuals;

  for (var i in schema){
    var item = schema[i];
    if (data.hasOwnProperty(i)){
      data[i] = _outputSchema(item, data[i]);
    }
  }

  for (var j in virtuals){
    var item = virtuals[j];
    if (item.hasOwnProperty('getter')){
      data[i] = item.getter.call(data);
    }
  }

  return data;
};