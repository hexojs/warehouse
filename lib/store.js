var _ = require('lodash');

var Store = module.exports = function Store(obj){
  var store = obj || {};

  this.list = function(){
    return store;
  };

  this.get = function(name){
    return _.clone(store[name]);
  };

  this.set = function(name, value){
    if (_.isObject(value)){
      Object.freeze(value);
    }
    store[name] = value;
  };

  this.remove = function(name){
    delete store[name];
  };
};