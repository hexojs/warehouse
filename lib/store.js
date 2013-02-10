var Store = module.exports = function(obj){
  var store = obj || {};

  this.list = function(){
    return store;
  };

  this.get = function(name){
    return store[name];
  };

  this.set = function(name, value){
    store[name] = value;
  };

  this.remove = function(name){
    delete store[name];
  };
};