var Virtual = module.exports = function Virtual(){};

Virtual.prototype.get = function(method){
  this.getter = method;
  return this;
};

Virtual.prototype.set = function(method){
  this.setter = method;
  return this;
};