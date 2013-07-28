/**
 * Module dependencies.
 */

var _ = require('lodash'),
  util = require('./util');

/**
 * Creates a new query instance.
 *
 * @param {Array} index
 * @param {Model} model
 * @api public
 */

var Query = module.exports = function(index, model){
  this._index = index;
  this._model = model;

  this.__defineGetter__('length', function(){
    return index.length;
  });
};

/**
 * Creates a new query instance.
 *
 * @param {Array} index
 * @return {Query}
 * @api private
 */

Query.prototype._createQuery = function(index){
  if (!index) index = this._index.slice();

  return new Query(index, this._model);
};

/**
 * Iterates over the query.
 *
 * @param {Function} iterator
 * @return {Query}
 * @api public
 */

Query.prototype.forEach = Query.prototype.each = function(iterator){
  var index = this._index;

  for (var i = 0, len = index.length; i < len; i++){
    iterator(this.get(index[i]), i);
  }

  return this;
};

/**
 * Returns an array containing all items.
 *
 * @return {Array}
 * @api public
 */

Query.prototype.toArray = function(){
  var arr = [];

  this.each(function(item){
    arr.push(item);
  });

  return arr;
};

/**
 * Returns the number of items in the query.
 *
 * @return {Number}
 * @api public
 */

Query.prototype.count = function(){
  return this.length;
};

/**
 * Updates all items in the query.
 *
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Query}
 * @api public
 */

Query.prototype.update = function(obj, callback){
  var model = this._model,
    arr = [];

  this.each(function(item){
    model.updateById(item._id, obj, function(doc){
      if (doc) arr.push(doc);
    });
  });

  callback && callback(arr);

  return this;
};

/**
 * Replaces all items in the query.
 *
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Query}
 * @api public
 */

Query.prototype.replace = function(obj, callback){
  var model = this._model,
    arr = [];

  this.each(function(item){
    model.replaceById(item._id, obj, function(doc){
      if (doc) arr.push(doc);
    });
  });

  callback && callback(arr);

  return this;
};

/**
 * Removes all items in the query.
 *
 * @param {Function} [callback]
 * @return {Query}
 * @api public
 */

Query.prototype.remove = function(callback){
  var model = this._model,
    arr = [];

  this.each(function(item){
    model.removeById(item._id, function(doc){
      if (doc) arr.push(doc);
    });
  });

  callback && callback(arr);

  return this;
};

/**
 * Gets the item at the specified index.
 *
 * @param {Number} num
 * @return {Document}
 * @api public
 */

Query.prototype.eq = function(num){
  if (this.length){
    if (num < 0) num = this.length + num;
    return this.get(this._index[num]);
  }
};

/**
 * Returns the first item in the query.
 *
 * @return {Document}
 * @api public
 */

Query.prototype.first = function(){
  return this.eq(0);
};

/**
 * Returns the last item in the query.
 *
 * @return {Document}
 * @api public
 */

Query.prototype.last = function(){
  return this.eq(this.length - 1);
};

/**
 * Returns the specified range of the query.
 *
 * @param {Number} start
 * @param {Number} [end]
 * @return {Query}
 * @api public
 */

Query.prototype.slice = function(start, end){
  return this._createQuery([].slice.apply(this._index, arguments));
};

/**
 * Limits the number of items returned.
 *
 * @param {Number} num
 * @return {Query}
 * @api public
 */

Query.prototype.limit = function(num){
  return this.slice(0, num);
};

/**
 * Specifies the number of items to skip.
 *
 * @param {Number} num
 * @return {Query}
 * @api public
 */

Query.prototype.skip = function(num){
  return this.slice(num);
};

/**
 * Returns the query in reversed order.
 *
 * @return {Query}
 * @api public
 */

Query.prototype.reverse = function(){
  return this._createQuery(util.reverse(this._index));
};

/**
 * Sorts the model.
 *
 * @param {String|Object} orderby
 * @param {Number|String} [order]
 * @return {Query}
 * @api public
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

  var arr = this._index.slice().sort(function(a, b){
    var orderA = data[a][orderby],
      orderB = data[b][orderby];

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
    if (order == -1 || order == 'desc' || order == 'descending' ) arr.reverse();
  }

  return this._createQuery(arr);
};

/**
 * Returns the model in random order.
 *
 * @return {Query}
 * @api public
 */

Query.prototype.random = Query.prototype.shuffle = function(){
  return this._createQuery(util.shuffle(this._index));
};

/**
 * Checks if the given `data` matched against the conditions.
 *
 * @param {Object} data
 * @param {Object} conditions
 * @return {Boolean}
 * @api private
 */
/*
var _find = function(data, conditions){
  var match = true;

  for (var i in conditions){
    var query = conditions[i],
      item = data[i];

    if (_.isRegExp(query)){
      match = query.test(item);
    } else if (_.isObject(query)){
      for (var j in query){
        var rule = query[j];

        switch (j){
          case '$lt':
            match = item < rule;
            break;

          case '$lte':
          case '$max':
            match = item <= rule;
            break;

          case '$gt':
            match = item > rule;
            break;

          case '$gte':
          case '$min':
            match = item >= rule;
            break;

          case '$length':
            var length = item.length;

            if (_.isObject(rule)){
              for (var k in rule){
                var sub = rule[k];

                switch (k){
                  case '$lt':
                    match = length < sub;
                    break;
                  case '$lte':
                    match = length <= sub;
                    break;
                  case '$gt':
                    match = length > sub;
                    break;
                  case '$gte':
                    match = length >= sub;
                    break;
                }

                if (!match) break;
              }
            } else {
              match = length === rule;
            }

            break;

          case '$in':
            if (!Array.isArray(rule)) rule = [rule];

            var isArr = Array.isArray(item);
            match = false;

            for (var i=0, len=rule.length; i<len; i++){
              if (isArr){
                if (item.indexOf(rule[i]) !== -1){
                  match = true;
                  break;
                }
              } else {
                if (item === rule[i]){
                  match = true;
                  break;
                }
              }
            }
            break;

          case '$nin':
            if (!Array.isArray(rule)) rule = [rule];

            var isArr = Array.isArray(item);

            for (var i=0, len=rule.length; i<len; i++){
              if (isArr){
                if (item.indexOf(rule[i]) !== -1){
                  match = false;
                  break;
                }
              } else {
                if (item === rule[i]){
                  match = false;
                  break;
                }
              }
            }

            break;

          case '$all':
            if (!Array.isArray(rule)) rule = [rule];
            for (var i=0, len=rule.length; i<len; i++){
              if (item.indexOf(rule[i]) === -1){
                match = false;
                break;
              }
            }

            break;

          case '$exists':
            var exist = item != null && typeof item !== 'undefined';
            match = exist == rule;
            break;

          case '$ne':
            if (_.isObject(item) && _.isObject(rule)){
              match = JSON.stringify(rule) !== JSON.stringify(item);
            } else {
              match = rule !== item;
            }

            break;
        }

        if (!match) break;
      }
    } else {
      if (_.isObject(item) && _.isObject(query)){
        match = JSON.stringify(query) === JSON.stringify(item);
      } else {
        match = query === item;
      }
    }

    if (!match) break;
  }

  return match;
};*/
// http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
var _getProperty = function(obj, key){
  key = key.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');

  var split = key.split('.'),
    result = obj[split[0]];

  for (var i = 1, len = split.length; i < len; i++){
    result = result[split[i]];
  }

  return result;
};

Query.prototype._query = function(data, conditions){
  var match = true,
    keys = Object.keys(conditions),
    schema = this._model.schema;

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      item = _getProperty(data, key),
      query = conditions[key];

    if (query instanceof RegExp){
      match = query.test(item);
    } else if (_.isObject(query)){
      var queryKeys = Object.keys(query),
        path = schema.path(key),
        queryOperators = path ? path.queryOperators : {};

      for (var j = 0, len = queryKeys.length; j < len; j++){
        var queryKey = queryKeys[j];

        if (/^$/.test(queryKey)){
          var operator = queryOperators[queryKey.slice(1)];
          if (!operator) continue;

          match = operator(item, query[queryKey]);
        } else {
          match = _getProperty(item, queryKey) === query[queryKey];
        }

        if (!match) break;
      }
    } else {
      match = query === item;
    }

    if (!match) break;
  }

  return match;
};

/**
 * Finds the matching items.
 *
 * @param {Object} conditions
 * @param {Object} options
 * @return {Query}
 * @api public
 */

Query.prototype.find = function(conditions, options){
  var index = this._index,
    arr = [];

  for (var i = 0, len = this.length; i < len; i++){
    if (_find(this._model._getRaw(index[i]), conditions)) arr.push(index[i]);
    if (arr.length === options.limit) break;
  }

  return this._createQuery(arr);
  /*var arr = [];

  for (var i = 0, len = this.length; i < len; i++){
    if (_find(this.eq(i), conditions)) arr.push(this._index[i]);
    if (arr.length === options.limit) break;
  }

  return this._createQuery(arr);*/
};

/**
 * Finds the first matching item.
 *
 * @param {Object} conditions
 * @return {Document}
 * @api public
 */

Query.prototype.findOne = function(conditions){
  return this.find(conditions, {limit: 1}).first();
};