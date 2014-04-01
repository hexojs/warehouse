var _ = require('lodash'),
  util = require('./util'),
  Types = require('./types'),
  SchemaType = require('./schematype'),
  getProperty = util.getProperty,
  getType = util.getType;

var schemaType = new SchemaType();

var types = {
  Array: new Types.Array(),
  Boolean: new Types.Boolean(),
  Date: new Types.Date(),
  Object: new Types.Object(),
  Number: new Types.Number(),
  String: new Types.String()
};

/**
* The query constructor.
*
* Warehouse uses a MongoDB-like way to query documents.
*
* **Logical operators**
*
* You can use an array of two or more expressions in logical operators. For example:
*
* ``` js
* query.find({
*   $or: [{comments: true}, {published: false}]
* });
* ```
*
* - **$or** - Performs a logical `OR` operation
* - **$and** - Performs a logical `AND` operation
* - **$not** - Performs a logical `NOT` operation
* - **$nor** - Performs a logical `NOR` operation
*
* @class Query
* @param {Array} index
* @constructor
* @module warehouse
*/

var Query = module.exports = function(index){
  /**
  * The index of the query.
  *
  * @property _index
  * @type Array
  * @private
  */

  this._index = index;

  /**
  * The fields to populate.
  *
  * @property _populates
  * @type Array
  * @private
  */

  this._populates = [];

  /**
  * Returns the number of items in the query.
  *
  * @property length
  * @type Number
  * @readOnly
  * @default 0
  */

  this.__defineGetter__('length', function(){
    return index.length;
  });
};

/**
* Creates a new query.
*
* @method _createQuery
* @param {Array} index
* @return {Query}
* @private
*/

Query.prototype._createQuery = function(index){
  if (!index) index = this._index.slice();

  var query = new this._model._query(index);

  query._populates = this._populates.slice();

  return query;
};

/**
* Iterates over the query.
*
* @method forEach
* @param {Function} iterator
* @chainable
*/

Query.prototype.forEach = function(iterator){
  var index = this._index,
    model = this._model,
    populates = this._populates;

  for (var i = 0, len = index.length; i < len; i++){
    iterator(model._populate(model.get(index[i]), populates), i);
  }

  return this;
};

/**
* Alias for {% crosslink Query.forEach %}
*
* @method each
* @param {Function} iterator
* @chainable
*/
Query.prototype.each = Query.prototype.forEach;

/**
* Returns an array containing all documents in the query.
*
* @method toArray
* @return {Array}
*/

Query.prototype.toArray = function(){
  var arr = [];

  this.each(function(item){
    arr.push(item);
  });

  return arr;
};

/**
* Returns the number of documents in the query.
*
* @method count
* @return {Number}
*/

Query.prototype.count = function(){
  return this.length;
};

/**
* Alias for {% crosslink Query.count %}
*
* @method size
* @return {Number}
*/
Query.prototype.size = Query.prototype.count;

/**
* Updates all documents in the query.
*
* @method update
* @param {Object} obj
* @param {Function} [callback]
* @chainable
*/

Query.prototype.update = function(obj, callback){
  var model = this._model,
    index = this._index,
    arr = [];

  for (var i = 0, len = index.length; i < len; i++){
    model.updateById(index[i], obj, function(item){
      if (item) arr.push(item);
    });
  }

  callback && callback(arr);

  return this;
};

/**
* Replaces all documents in the query.
*
* @method replace
* @param {Object} obj
* @param {Function} [callback]
* @chainable
*/

Query.prototype.replace = function(obj, callback){
  var model = this._model,
    index = this._index,
    arr = [];

  for (var i = 0, len = index.length; i < len; i++){
    model.replaceById(index[i], obj, function(item){
      if (item) arr.push(item);
    });
  }

  callback && callback(arr);

  return this;
};

/**
* Removes all documents in the query.
*
* @method remove
* @param {Function} [callback]
* @chainable
*/

Query.prototype.remove = function(callback){
  var model = this._model,
    index = this._index,
    arr = [];

  for (var i = 0, len = index.length; i < len; i++){
    model.removeById(index[i], function(item){
      if (item) arr.push(item);
    });
  }

  callback && callback(arr);

  return this;
};

/**
* Returns the document at the specified index.
* `num` can be a positive or negative number.
*
* @method eq
* @param {Number} num
* @return {Document}
*/

Query.prototype.eq = function(num){
  if (this.length){
    if (num < 0) num = this.length + num;
    return this._model.get(this._index[num]);
  }
};

/**
* Returns the first document in the query.
*
* This method is an alias of:
*
* ``` js
* query.eq(0);
* ```
*
* @method first
* @return {Document}
*/

Query.prototype.first = function(){
  return this.eq(0);
};

/**
* Returns the last item in the model.
*
* This method is an alias of:
*
* ``` js
* query.eq(-1);
* ```
*
* @method last
* @return {Document}
*/

Query.prototype.last = function(){
  return this.eq(-1);
};

/**
* Returns the specified range of documents in the query.
*
* @method slice
* @param {Number} start
* @param {Number} [end]
* @return {Query}
*/

Query.prototype.slice = function(start, end){
  return this._createQuery([].slice.apply(this._index, arguments));
};

/**
* Limits the number of items returned.
*
* This method is an alias of:
*
* ``` js
* query.slice(0, num);
* ```
*
* @method limit
* @param {Number} num
* @return {Query}
*/

Query.prototype.limit = function(num){
  return this.slice(0, num);
};

/**
* Specifies the number of items to skip.
*
* This method is an alias of:
*
* ``` js
* query.slice(num);
* ```
*
* @method skip
* @param {Number} num
* @return {Query}
*/

Query.prototype.skip = function(num){
  return this.slice(num);
};

/**
* Returns the query in reversed order.
*
* @method reverse
* @return {Query}
*/

Query.prototype.reverse = function(){
  return this._createQuery(util.reverse(this._index));
};

/**
* Sorts the documents in the query.
*
* Example:
*
* ``` js
* query.sort('date', -1);
* query.sort({date: -1, title: 1});
* ```
*
* If the `order` equals to `-1`, `desc` or `descending`, the data will be returned in reversed order.
*
* @method sort
* @param {String|Object} orderby
* @param {Number|String} [order]
* @return {Query}
*/

Query.prototype.sort = function(orderby, order){
  if (_.isObject(orderby)){
    var query = this._createQuery();

    for (var i in orderby){
      (function(i){
        query = query.sort(i, orderby[i]);
      })(i);
    }

    return query;
  }

  var data = {};

  this.each(function(item){
    data[item._id] = item;
  });

  var arr = this._index.slice().sort(function(a, b){
    var orderA = getProperty(data[a], orderby),
      orderB = getProperty(data[b], orderby);

    if (orderA < orderB){
      return -1;
    } else if (orderA > orderB){
      return 1;
    } else {
      return 0;
    }
  });

  if (order){
    order = order.toString().toLowerCase();
    if (order == -1 || order == 'desc' || order == 'descending') arr.reverse();
  }

  return this._createQuery(arr);
};

/**
* Returns the documents in the query in random order.
*
* @method random
* @return {Query}
*/

Query.prototype.random = Query.prototype.shuffle = function(){
  return this._createQuery(util.shuffle(this._index));
};

/**
* Alias for {% crosslink Query.random %}
*
* @method shuffle
* @return {Query}
*/
Query.prototype.shuffle = Query.prototype.random;

/**
* Checks if the `data` matches the `conditions`.
*
* @method _query
* @param {Object} data
* @param {Object} conditions
* @return {Boolean}
* @private
*/

Query.prototype._query = function(data, conditions){
  var match = true,
    keys = Object.keys(conditions);

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      query = conditions[key];

    switch (key){
      case '$or':
        var subMatch = false;

        for (var j = 0, qLen = query.length; j < qLen; j++){
          if (this._query(data, query[j])){
            subMatch = true;
            break;
          }
        }

        match = subMatch;

        break;

      case '$and':
        for (var j = 0, qLen = query.length; j < qLen; j++){
          if (!this._query(data, query[j])){
            match = false;
            break;
          }
        }

        break;

      case '$not':
        match = !this._query(data, query);
        break;

      case '$nor':
        for (var j = 0, qLen = query.length; j < qLen; j++){
          if (this._query(data, query[j])){
            match = false;
            break;
          }
        }

        break;

      default:
        var path = this._model.schema.path(key);

        if (!path){
          path = item == null ? schemaType : types[item.constructor.name];
        }

        var item = path.cast(getProperty(data, key));

        if (getType(query) === 'Object'){
          var qKeys = Object.keys(query);

          for (var j = 0, qLen = qKeys.length; j < qLen; j++){
            var qKey = qKeys[j];

            if (/^\$/.test(qKey)){
              var operator = path['q' + qKey];
              if (operator == null) continue;

              match = operator(item, query[qKey]);
            } else {
              match = this._query(item, query[qKey]);
            }

            if (!match) break;
          }
        } else {
          match = path.compare(item, query);
        }
    }

    if (!match) break;
  }

  return match;
};

/**
* Finds the matching documents in the query.
*
* @method find
* @param {Object} conditions
* @param {Object} [options]
*   @param {Number} [options.limit] The maximum number of items in the result
* @return {Query}
*/

Query.prototype.find = function(conditions, options){
  var index = this._index,
    model = this._model,
    arr = [];

  for (var i = 0, len = this.length; i < len; i++){
    if (this._query(model._getRaw(index[i]), conditions)) arr.push(index[i]);
    if (options && arr.length === options.limit) break;
  }

  return this._createQuery(arr);
};

/**
* Finds the first matching document.
*
* @method findOne
* @param {Object} conditions
* @return {Document}
*/

Query.prototype.findOne = function(conditions){
  return this.find(conditions, {limit: 1}).first();
};

/**
* Sets the path to populate.
*
* @method populate
* @param {String} name
* @chainable
*/

Query.prototype.populate = function(name){
  this._populates.push(name);

  return this;
};

/**
* Creates an array of values by iterating each element in the collection.
*
* @method map
* @param {Function|String} callback
* @return {Array}
*/
Query.prototype.map = function(callback){
  return _.map(this.toArray(), callback);
};

/**
* Reduces a collection to a value which is the accumulated result of iterating each element in the collection.
*
* @method reduce
* @param {Function} callback
* @param {Any} [initial] Initial value
* @return {Any}
*/
Query.prototype.reduce = function(callback, initial){
  return _.reduce(this.toArray(), callback, initial);
};

/**
* Reduces a collection to a value which is the accumulated result of iterating each element in the collection from right to left.
*
* @method reduceRight
* @param {Function} callback
* @param {Any} [initial] Initial value
* @return {Any}
*/
Query.prototype.reduceRight = function(callback, initial){
  return _.reduceRight(this.toArray(), callback, initial);
};

/**
* Iterates over the query and returns all elements the callback returns truey for.
*
* @method filter
* @param {Function} callback
* @return {Query}
*/
Query.prototype.filter = function(callback){
  var arr = [];


  this.each(function(item, i){
    if (callback(item, i)) arr.push(item._id);
  });

  return this._createQuery(arr);
};