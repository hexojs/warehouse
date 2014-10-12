'use strict';

var SchemaType = require('../schematype'),
  util = require('../util');

function SchemaTypeObject(name, options){
  SchemaType.call(this, name, options);
}

util.inherits(SchemaTypeObject, SchemaType);
/*
SchemaTypeObject.prototype.u$set = function(value_, update, data){
  var keys = Object.keys(update),
    value, key, obj;

  if (!keys.length) return value_;

  value = util.deepCloneNoPrototype(value_);

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];
    obj = update[i];

    if (obj != null){
      util.setProp(value, key, obj);
    } else {
      util.delProp(value, key);
    }
  }

  return value;
};

SchemaTypeObject.prototype.u$unset = function(value_, update, data){
  var keys = Object.keys(update),
    value, key;

  if (!keys.length) return value_;

  for (var i = 0, len = keys.length; i < len; i++){
    key = keys[i];

    if (update[key]){
      util.delProp(value, key);
    }
  }

  return value;
};*/

module.exports = SchemaTypeObject;