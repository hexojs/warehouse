/**
* The basic schema type constructor.
*
* This is an abstract class. Every schema type should inherit this class. For example:
*
* ``` js
* var SchemaCustom = function(options){
*   SchemaType.call(this, options);
* };
*
* SchemaCustom.__proto__ = SchemaType;
* SchemaCustom.prototype.__proto__ = SchemaType.prototype;
* ```
*
* **Query operators**
*
* To add a query operator, adds a method whose name started with `q$`. For example:
*
* ``` js
* SchemaCustom.q$foo = function(data, value){
*   // ...
* };
* ```
*
* The `data` parameter is the data in the database; the `value` parameter is the value passed to the query operator.
* The return value should be a boolean indicating whether the data passed the test.
*
* **Update operators**
*
* To add a update operator, adds a method whose name started with `u$`. For example:
*
* ``` js
* SchemaCustom.u$bar = function(data, value){
*   // ...
* };
* ```
*
* The `data` parameter is the data in the database; the `value` parameter is the value passed to the update operator.
* The return value will replace the original data.
*
* @class SchemaType
* @param {Object} [options]
* @constructor
* @module warehouse
*/

var SchemaType = module.exports = function(options){
  options = options || {};

  if (options.hasOwnProperty('default')){
    var defaults = options.default,
      fn = typeof defaults === 'function';

    /**
    * The default value of the field.
    *
    * @property default
    * @type Function
    */

    this.default = function(){
      return fn ? defaults() : defaults;
    };
  }

  /**
  * Determines whether the field is required.
  *
  * @property required
  * @type Boolean
  * @default false
  */

  this.required = !!options.required;
};

/**
* Validates a value.
*
* @method checkRequired
* @param {Any} value
* @return {Any}
*/

SchemaType.prototype.checkRequired = function(value){
  return value != null;
};

/**
* Casts a value.
*
* @method cast
* @param {Any} value
* @return {Any}
*/

SchemaType.prototype.cast = function(value){
  return value;
};

/**
* Transforms a value into JSON.
*
* @method save
* @param {Any} value
* @return {Any}
*/

SchemaType.prototype.save = function(value){
  return value;
};

/**
* Compares data.
*
* @method compare
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.compare = function(data, value){
  return data == value;
};

/**
* Checks whether the field exists.
*
* `q$exists` is also aliased as `q$exist`.
*
* @method q$exists
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$exists = SchemaType.prototype.q$exist = function(data, value){
  return (data != null) == value;
};

/**
* Checks whether `data` is equal to `value`. If not, return true.
*
* @method q$ne
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$ne = function(data, value){
  return !this.compare(data, value);
};

/**
* Checks whether `data` is less than `value`.
*
* @method q$lt
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$lt = function(data, value){
  return data < value;
};

/**
* Checks whether `data` is less than or equal to `value`.
*
* `q$lte` is also aliased as `q$max`.
*
* @method q$lte
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$lte = SchemaType.prototype.q$max = function(data, value){
  return data <= value;
};

/**
* Checks whether `data` is greater than `value`.
*
* @method q$gt
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$gt = function(data, value){
  return data > value;
};

/**
* Checks whether `data` is greater than or equal to `value`.
*
* `q$gte` is also aliased as `q$min`.
*
* @method q$gte
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$gte = SchemaType.prototype.q$min = function(data, value){
  return data >= value;
};

/**
* Checks whether `data` contains `value`.
*
* @method q$in
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$in = function(data, value){
  if (!Array.isArray(value)) value = [value];

  for (var i = 0, len = value.length; i < len; i++){
    if (data === value[i]) return true;
  }

  return false;
};

/**
* Checks whether `data` not contains `value`.
*
* @method q$nin
* @param {Any} data
* @param {Any} value
* @return {Boolean}
*/

SchemaType.prototype.q$nin = function(data, value){
  if (!Array.isArray(value)) value = [value];

  for (var i = 0, len = value.length; i < len; i++){
    if (data === value[i]) return false;
  }

  return true;
};

/**
* Checks whether `data` is between `value`.
*
* @method q$within
* @param {Any} data
* @param {Array} value
* @return {Boolean}
*/

var within = SchemaType.prototype.q$within = function(data, value){
  return data >= value[0] && data <= value[1];
};

/**
* Checks whether `data` is not between `value`.
*
* @method q$without
* @param {Any} data
* @param {Array} value
* @return {Boolean}
*/

SchemaType.prototype.q$without = function(data, value){
  return !within(data, value);
};

/**
* Validates `data` with `value` function.
*
* @method q$where
* @param {Any} data
* @param {Function} value
* @return {Boolean}
*/

SchemaType.prototype.q$where = function(data, value){
  return value(data);
};