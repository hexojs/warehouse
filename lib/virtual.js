/**
 * Creates a new virtual instance.
 *
 * @api public
 */

var Virtual = module.exports = function(method){
  if (method){
    this.get(method);
  }
};

Virtual.type = Virtual.prototype.type = Virtual;

/**
 * Binds a getter.
 *
 * @param {Function} method
 * @return {Virtual}
 * @api public
 */

Virtual.prototype.get = function(method){
  if (typeof method !== 'function') throw new Error('Virtual getter must be a function!');

  this.getter = method;
  return this;
};

/**
 * Binds a setter.
 *
 * @param {Function} method
 * @return {Virtual}
 * @api public
 */

Virtual.prototype.set = function(method){
  if (typeof method !== 'function') throw new Error('Virtual setter must be a function!');

  this.setter = method;
  return this;
};