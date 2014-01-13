/**
* The virtual constructor.
*
* @class Virtual
* @param {Function} [method] Getter
* @module warehouse
*/

var Virtual = module.exports = function(method){
  if (method){
    this.get(method);
  }
};

/**
* @property type
* @type Virtual
* @static
*/

Virtual.type = Virtual.prototype.type = Virtual;

/**
* Binds a getter.
*
* @method get
* @param {Function} method
* @chainable
*/

Virtual.prototype.get = function(method){
  if (typeof method !== 'function') throw new Error('Virtual getter must be a function!');

  this.getter = method;
  return this;
};

/**
* Binds a setter.
*
* @method set
* @param {Function} method
* @chainable
*/

Virtual.prototype.set = function(method){
  if (typeof method !== 'function') throw new Error('Virtual setter must be a function!');

  this.setter = method;
  return this;
};