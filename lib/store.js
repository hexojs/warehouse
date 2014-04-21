/**
* The store constructor.
*
* @class Store
* @param {Object} [obj]
* @constructor
* @module warehouse
*/

var Store = module.exports = function(obj){
  var store = obj || {};

  /**
  * Lists all elements.
  *
  * @method list
  * @return {Object}
  */

  this.list = function(){
    return store;
  };

  /**
  * Gets the data by id.
  *
  * @method get
  * @param {Any} id
  * @return {Any}
  */

  this.get = function(id){
    return store[id];
  };

  /**
  * Sets a new data with `id`.
  *
  * @method set
  * @param {Any} id
  * @param {Any} value
  */

  this.set = function(id, value){
    store[id] = value;
  };

  /**
  * Removes an element by id.
  *
  * @method remove
  * @param {Any} id
  */

  this.remove = function(id){
    delete store[id];
  };

  /**
   * Deletes all elements in the store.
   *
   * @method destroy
   */

  this.destroy = function() {
    for (var id in store) {
      this.remove(id);
    }
  };
};