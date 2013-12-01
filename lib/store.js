/**
* Store.
*
* @class Store
* @param {Object} [obj]
* @constructor
* @namespace Warehouse
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
  * Gets the specified data.
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
  * Removes a element.
  *
  * @method remove
  * @param {Any} id
  */

  this.remove = function(id){
    delete store[id];
  };
};