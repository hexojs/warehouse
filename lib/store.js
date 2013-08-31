var Store = module.exports = function(obj){
  var store = obj || {};

  /**
   * Lists all elements.
   *
   * @return {Object}
   * @api public
   */

  this.list = function(){
    return store;
  };

  /**
   * Gets the specified data.
   *
   * @param {Any} id
   * @return {Object}
   * @api public
   */

  this.get = function(id){
    return store[id];
  };

  /**
   * Sets a new data with `id`.
   *
   * @param {Any} id
   * @param {Any} value
   * @return {Object}
   * @api public
   */

  this.set = function(id, value){
    store[id] = value;
  };

  /**
   * Removes a element.
   *
   * @param {Any} id
   * @api public
   */

  this.remove = function(id){
    delete store[id];
  };
};