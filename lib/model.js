/**
 * Module dependencies.
 */

var async = require('async'),
  _ = require('lodash'),
  Schema = require('./schema'),
  Document = require('./document'),
  Query = require('./query'),
  EventEmitter = require('events').EventEmitter,
  Virtual = require('./virtual'),
  Types = require('./types'),
  SchemaType = require('./schematype'),
  util = require('./util'),
  getProperty = util.getProperty,
  setProperty = util.setProperty,
  deleteProperty = util.deleteProperty;

/**
 * Creates a new model instance.
 *
 * @param {String} name
 * @param {Schema} schema
 * @param {Database} database
 * @api public
 */

var Model = module.exports = function(name, schema, database){
  var self = this;

  this._name = name;
  this._database = database;
  this._store = database._store[name] = database._store[name] || [];
  this._index = [];
  this.schema = schema;

  for (var i in schema.statics){
    this[i] = schema.statics[i];
  }

  var doc = this._doc = function(obj){
    Document.call(this, obj);
  };

  doc.__proto__ = Document;
  doc.prototype.__proto__ = Document.prototype;
  doc.prototype._model = this;

  for (var i in schema.methods){
    doc.prototype[i] = schema.methods[i];
  }

  this._updateIndex();

  this.__defineGetter__('length', function(){
    return this.count();
  });
};

/**
 * Inherits from EventEmitter.
 */

Model.prototype.__proto__ = EventEmitter.prototype;

/**
 * Updates index of model.
 *
 * @api private
 */

Model.prototype._updateIndex = function(){
  var index = this._index,
    store = this._store;

  index.length = 0;

  for (var i = 0, len = store.length; i < len; i++){
    index.push(store[i]._id);
  }
};

/**
 * Creates a new query instance.
 *
 * @param {Array} [index]
 * @api private
 */

Model.prototype._createQuery = function(index){
  if (!index) index = this._index.slice();

  return new Query(index, this);
};

/**
 * Checks if `id` is used.
 *
 * @param {String} id
 * @return {Boolean}
 * @api private
 */

Model.prototype._checkID = function(id){
  return id ? this._index.indexOf(id) > -1 : false;
};

/**
 * Creates a new document.
 *
 * @param {Object} obj
 * @api public
 */

Model.prototype.new = function(obj){
  return new this._doc(obj);
};

/**
 * Apply the schema.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {any} value
 * @param {String} [prefix]
 * @return {Object}
 * @api private
 */

Model.prototype._applyGetter = function(obj, key, value, prefix){
  prefix = prefix || '';

  var schema = this.schema,
    path = schema.path(key);

  if (!path) return value;

  if (path.type === Virtual){
    if (!path.hasOwnProperty('getter')) return value;

    return path.getter.call(obj);
  } else {
    if (value == null) return null;

    var castValue = path.cast(value);

    if (path.type === Object){
      var keys = Object.keys(value),
        parentKey = prefix + key + '.';

      for (var i = 0, len = keys.length; i < len; i++){
        var key = keys[i],
          item = this._applyGetter(castValue, key, castValue[key], parentKey);

        if (item != null) castValue[key] = item;
      }

      return castValue;
    } else if (path.type === Array){
      var parentKey = prefix + key + '.',
        child = 0;

      if (!schema.path(parentKey + 0)) return castValue;

      for (var i = 0, len = castValue.length; i < len; i++){
        if (schema.path(parentKey + i)) child = i;

        var item = this._applySetter(castValue, child, castValue[i], parentKey);
        if (item != null) castValue[i] = item;
      }
    }

    return castValue;
  }
};

/**
 * Gets the document.
 *
 * @param {Number} id
 * @return {Document}
 * @api public
 */

Model.prototype.get = Model.prototype.findById = function(id){
  if (!this._checkID(id)) return null;

  var data = this._getRaw(id),
    paths = this.schema.paths,
    keys = Object.keys(paths);

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      item = this._applyGetter(data, key, data[i]);

    if (item != null) data[key] = item;
  }

  return new this._doc(data);
};

/**
 * Gets the raw data.
 *
 * @param {Number} id
 * @return {Object}
 * @api public
 */

Model.prototype._getRaw = function(id){
  return _.clone(this._store[this._index.indexOf(id)]);
};

/**
 * Iterates over the model.
 *
 * @param {Function} iterator
 * @return {Model}
 * @api public
 */

Model.prototype.forEach = Model.prototype.each = function(iterator){
  var index = this._index;

  for (var i = 0, len = index.length; i < len; i++){
    iterator(this.get(index[i]), i);
  }

  return this;
};

/**
 * Returns an array containing all items in the model.
 *
 * @return {Array}
 * @api public
 */

Model.prototype.toArray = function(){
  var arr = [];

  this.each(function(item){
    arr.push(item);
  });

  return arr;
};

/**
 * Returns the number of items in the model.
 *
 * @return {Number}
 * @api public
 */

Model.prototype.count = function(){
  return this._index.length;
};

/**
 * Applys the schema.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {any} value
 * @param {String} [prefix]
 * @return {Object}
 * @api private
 */

Model.prototype._applySetter = function(obj, name, value, prefix){
  prefix = prefix || '';

  var schema = this.schema,
    path = schema.path(prefix + name);

  if (!path) return value;

  if (path.type === Virtual){
    if (!path.hasOwnProperty('setter')) return value;
    path.setter.call(obj, value);
    return null;
  } else {
    if (value == null || !path.checkRequired(path.cast(value))){
      if (path.default){
        return path.cast(path.default());
      } else if (path.required){
        throw new Error('`' + prefix + name + '` is required!');
      } else {
        return null;
      }
    }

    var castValue = path.cast(value);
    if (castValue == null) return null;

    if (path.type === Object){
      var keys = Object.keys(castValue),
        parentKey = prefix + name + '.';

      for (var i = 0, len = keys.length; i < len; i++){
        var key = keys[i],
          item = this._applySetter(castValue, key, castValue[key], parentKey);

        if (item == null){
          deleteProperty(castValue, key);
        } else {
          setProperty(castValue, key, item);
        }
      }
    } else if (path.type === Array){
      var parentKey = prefix + name + '.',
        child = 0;

      if (!schema.path(parentKey + 0)) return castValue;

      for (var i = 0, len = castValue.length; i < len; i++){
        if (schema.path(parentKey + i)) child = i;

        var item = this._applySetter(castValue, child, castValue[i], parentKey);
        if (item != null) castValue[i] = item;
      }
    }

    if (path != null) castValue = path.save(castValue);
    return castValue;
  }
};

/**
 * Saves an item to the model.
 *
 * @param {Object} obj
 * @param {Function} callback
 * @api private
 */

Model.prototype._save = function(obj, callback){
  var data = _.clone(obj),
    schema = this.schema,
    paths = schema.paths,
    keys = Object.keys(paths),
    self = this;

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      item = this._applySetter(data, key, data[key]);

    if (item == null){
      deleteProperty(data, key);
    } else {
      setProperty(data, key, item);
    }
  }

  async.eachSeries(schema.pres.save, function(hook, next){
    hook(data, next);
  }, function(err){
    if (err) throw err;

    var index = self._index.indexOf(data._id);

    if (index > -1){
      self._store[index] = data;
    } else {
      self._store.push(data);
    }

    self._updateIndex();

    var doc = self.get(data._id);
    self.emit('save', doc);
    callback && callback(doc);

    var posts = schema.posts.save;

    for (var i = 0, len = posts.length; i < len; i++){
      posts[i](doc);
    }
  });
};

/**
 * Inserts an item to the model.
 *
 * @param {Object|Array} obj
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.insert = function(obj, callback){
  var self = this;

  if (Array.isArray(obj)){
    async.forEach(obj, function(item, next){
      self.insert(item, function(result){
        next(null, result);
      });
    }, function(err, results){
      callback && callback(results);
    });

    return this;
  }

  this._save(obj, function(result){
    self.emit('insert', result);
    callback && callback(result);
  });

  return this;
};

/**
 * Updates items in the model.
 *
 * @param {Object} conditions
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.update = function(conditions, obj, callback){
  if (_.isObject(conditions)){
    this.find(conditions).update(obj, callback);
  } else {
    this.updateById(conditions, obj, callback);
  }

  return this;
};

/**
 * Combines the old and the new data.
 *
 * @param {Object} data
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

var _update = function(data, obj){
  var keys = Object.keys(obj);

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      raw = getProperty(data, key),
      value = obj[key];

    if (_.isObject(value)){
      var subKeys = Object.keys(value),
        path = raw == null ? SchemaType : Types[raw.constructor.name],
        updateOperators = path.updateOperators;

      for (var j = 0, subLen = subKeys.length; j < subLen; j++){
        var subKey = subKeys[j];

        if (/^\$/.test(subKey)){
          var operator = updateOperators[subKey.slice(1)];
          if (operator == null) continue;

          setProperty(data, key, operator(raw, value));
        } else {
          setProperty(data, key + '.' + subKey, value);
        }
      }
    } else {
      setProperty(data, key, value);
    }
  }

  return data;
};

/**
 * Updates the specified item.
 *
 * @param {Number} id
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.updateById = function(id, obj, callback){
  if (!this._checkID(id)){
    callback && callback();
    return this;
  }

  var self = this;

  delete obj._id;

  this._save(_update(this._getRaw(id), obj), function(result){
    self.emit('update', rseult);
    callback && callback(result);
  });

  return this;
};

/**
 * Replaces items in the model.
 *
 * @param {Object} conditions
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.replace = function(conditions, obj, callback){
  if (_.isObject(conditions)){
    this.find(conditions).update(obj, callback);
  } else {
    this.replaceById(conditions, obj, callback);
  }

  return this;
};

/**
 * Replaces the specified item.
 *
 * @param {Number} id
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.replaceById = function(id, obj, callback){
  if (!this._checkID(id)){
    callback && callback();
    return this;
  }

  var self = this;

  obj._id = id;

  this._save(obj, function(result){
    self.emit('update', result);
    callback && callback(result);
  });

  return this;
};

/**
 * Remove items in the model.
 *
 * @param {Object} conditions
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.remove = function(conditions, callback){
  if (_.isObject(conditions)){
    this.find(conditions).remove(callback);
  } else {
    this.removeById(conditions, callback);
  }

  return this;
};

/**
 * Removes the specificed item.
 *
 * @param {Number} id
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.removeById = function(id, callback){
  if (!this._checkID(id)){
    callback && callback();
    return this;
  }

  var doc = this.get(id),
    schema = this.schema;

  async.eachSeries(schema.pres.remove, function(hook, next){
    hook(doc, next);
  }, function(err){
    if (err) throw err;

    delete this._store[this._index.indexOf(id)];
    this._updateIndex();
    this.emit('remove', doc);
    callback && callback(doc);

    var hooks = schema.posts.remove;

    for (var i = 0, len = hooks.length; i < len; i++){
      hooks[i](doc);
    }
  });
};

/**
 * Saves the given `obj`.
 *
 * @param {Object} obj
 * @param {Function} [callback]
 * @return {Model}
 * @api public
 */

Model.prototype.save = function(obj, callback){
  if (this._checkID(obj._id)){
    this.replaceById(obj._id, obj, callback);
  } else {
    this.insert(obj, callback);
  }

  return this;
};

/**
 * Deletes all items in the model.
 *
 * @return {Model}
 * @api public
 */

Model.prototype.destroy = function(){
  this._store.length = 0;
  this._index.length = 0;

  return this;
};

/**
 * Gets the item at the specified index.
 *
 * @param {Number} num
 * @return {Document}
 * @api public
 */

Model.prototype.eq = function(num){
  if (this.length){
    if (num < 0) num = this.length + num;
    return this.get(this._index[num]);
  }
};

/**
 * Returns the first item in the model.
 *
 * @return {Document}
 * @api public
 */

Model.prototype.first = function(){
  return this.eq(0);
};

/**
 * Returns the last item in the model.
 *
 * @return {Document}
 * @api public
 */

Model.prototype.last = function(){
  return this.eq(this.length - 1);
};

/**
 * Returns the specified range of the model.
 *
 * @param {Number} start
 * @param {Number} [end]
 * @return {Query}
 * @api public
 */

Model.prototype.slice = function(start, end){
  return this._createQuery().slice(start, end);
};

/**
 * Limits the number of items returned.
 *
 * @param {Number} num
 * @return {Query}
 * @api public
 */

Model.prototype.limit = function(num){
  return this.slice(0, num);
};

/**
 * Specifies the number of items to skip.
 *
 * @param {Number} num
 * @return {Query}
 * @api public
 */

Model.prototype.skip = function(num){
  return this.slice(num);
};

/**
 * Returns the model in reversed order.
 *
 * @return {Query}
 * @api public
 */

Model.prototype.reverse = function(){
  return this._createQuery().reverse();
};

/**
 * Sorts the model.
 *
 * @param {String|Object} orderby
 * @param {Number|String} [order]
 * @return {Query}
 * @api public
 */

Model.prototype.sort = function(orderby, order){
  var query = this._createQuery();

  return query.sort(orderby, order);
};

/**
 * Returns the model in random order.
 *
 * @return {Query}
 * @api public
 */

Model.prototype.random = Model.prototype.shuffle = function(){
  return this._createQuery().random();
};

/**
 * Finds the matching items.
 *
 * @param {Object} conditions
 * @param {Object} options
 * @return {Query}
 * @api public
 */

Model.prototype.find = function(conditions, options){
  return this._createQuery().find(conditions, options);
};

/**
 * Finds the first matching item.
 *
 * @param {Object} conditions
 * @return {Document}
 * @api public
 */

Model.prototype.findOne = function(conditions){
  return this.find(conditions, {limit: 1}).first();
};