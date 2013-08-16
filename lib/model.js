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
  deleteProperty = util.deleteProperty,
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
    if (!obj) obj = {};

    Document.call(this, obj);
  };

  doc.__proto__ = Document;
  doc.prototype.__proto__ = Document.prototype;
  doc.prototype._model = this;

  for (var i in schema.methods){
    doc.prototype[i] = schema.methods[i];
  }

  var query = this._query = function(index){
    Query.call(this, index);
  };

  query.__proto__ = Query;
  query.prototype.__proto__ = Query.prototype;
  query.prototype._model = this;

  this._updateIndex();

  this.__defineGetter__('length', function(){
    return this.count();
  });

  this.emit('init', this);
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

  return new this._query(index);
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

Model.prototype._applyGetter = function(obj, name, value, prefix){
  prefix = prefix || '';

  var schema = this.schema,
    path = schema.path(prefix + name);

  if (path == null) return value;

  if (path.type === Virtual){
    if (!path.getter) return value;

    return path.getter.call(obj);
  } else {
    if (value == null) return null;

    var castValue = path.cast(value);

    if (path.type === Object){
      var nested = path._nested;

      if (nested){
        var keys = Object.keys(nested),
          parentKey = prefix + name + '.';

        for (var i = 0, len = keys.length; i < len; i++){
          var key = keys[i],
            item = this._applyGetter(obj, key, castValue[key], parentKey);

          if (item != null) castValue[key] = item;
        }
      }
    } else if (path.type === Array){
      var nested = path._nested;

      if (nested){
        var keys = Object.keys(nested),
          parentKey = prefix + name + '.',
          child = 0;

        for (var i = 0, len = keys.length; i < len; i++){
          if (nested.hasOwnProperty(i)) child = i;

          var item = this._applyGetter(obj, child, castValue[i], parentKey);
          if (item != null) castValue[i] = item;
        }
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
    keys = Object.keys(this.schema.tree);

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      item = this._applyGetter(data, key, data[key]);

    if (item != null) data[key] = item;
  }

  return new this._doc(data);
};

/**
 * Clones an object.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
var _clone = function(obj){
  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    var copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    var copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = _clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    var copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = _clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
};

/**
 * Gets the raw data.
 *
 * @param {Number} id
 * @return {Object}
 * @api public
 */

Model.prototype._getRaw = function(id){
  return _clone(this._store[this._index.indexOf(id)]);
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

  if (path == null) return value;

  if (path.type === Virtual){
    if (!path.setter) return value;

    path.setter.call(obj, value);
    return null;
  } else {
    var castValue = value == null ? null : path.cast(value);

    if (castValue == null || !path.checkRequired(castValue)){
      if (path.default){
        return path.cast(path.default());
      } else if (path.required){
        throw new Error('`' + prefix + name + '` is required!');
      } else {
        return null;
      }
    }

    if (path.type === Object){
      var nested = path._nested;

      if (nested){
        var keys = Object.keys(nested),
          parentKey = prefix + name + '.';

        for (var i = 0, len = keys.length; i < len; i++){
          var key = keys[i];

          if (castValue.hasOwnProperty(key)){
            var item = this._applySetter(obj, key, castValue[key], parentKey);

            if (item == null){
              delete castValue[key];
            } else {
              castValue[key] = item;
            }
          }
        }

        castValue = _.extend(castValue, getProperty(obj, prefix + name));
      }
    } else if (path.type === Array){
      var nested = path._nested;

      if (nested){
        var keys = Object.keys(nested),
          parentKey = prefix + name + '.',
          child = 0;

        for (var i = 0, len = keys.length; i < len; i++){
          if (nested.hasOwnProperty(i)) child = i;

          var item = this._applySetter(obj, child, castValue[i], parentKey);
          if (item != null) castValue[i] = item;
        }
      }
    }

    return path.save(castValue);
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
  var schema = this.schema,
    keys = Object.keys(schema.tree),
    self = this;

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      item = this._applySetter(obj, key, obj[key]);

    if (item == null){
      delete obj[key];
    } else {
      obj[key] = item;
    }
  }

  async.eachSeries(schema.pres.save, function(hook, next){
    hook(obj, next);
  }, function(err){
    if (err) throw err;

    var index = self._index.indexOf(obj._id);

    if (index > -1){
      self._store[index] = obj;
    } else {
      self._store.push(obj);
      self._updateIndex();
    }

    var doc = self.get(obj._id);
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
    var results = [];

    async.each(obj, function(item, next){
      self.insert(item, function(result){
        results.push(result);
        next();
      });
    }, function(err){
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

Model.prototype._update = function(data, obj){
  var keys = Object.keys(obj);

  for (var i = 0, len = keys.length; i < len; i++){
    var key = keys[i],
      raw = getProperty(data, key),
      value = obj[key];

    if (getType(value) === 'Object'){
      var subKeys = Object.keys(value),
        path = this.schema.path(key);

      if (!path){
        path = raw == null ? schemaType : types[raw.raw.constructor.name];
      }

      for (var j = 0, subLen = subKeys.length; j < subLen; j++){
        var subKey = subKeys[j];

        if (/^\$/.test(subKey)){
          var operator = path['u' + subKey];
          if (operator == null) continue;

          setProperty(data, key, operator(raw, value[subKey]));
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

  this._save(this._update(this._getRaw(id), obj), function(result){
    self.emit('update', result);
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

  this._save(_.extend({}, obj, {_id: id}), function(result){
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
    schema = this.schema,
    self = this;

  async.eachSeries(schema.pres.remove, function(hook, next){
    hook(doc, next);
  }, function(err){
    if (err) throw err;

    self._store.splice(self._index.indexOf(id), 1);
    self._updateIndex();
    self.emit('remove', doc);
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
  return this.eq(-1);
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

/**
 * Popluates document references.
 *
 * @param {Object} obj
 * @param {Array} populates
 * @return {Object}
 * @api private
 */

Model.prototype._populate = function(obj, populates){
  if (!populates.length) return obj;

  var schema = this.schema,
    database = this._database,
    models = {};

  for (var i = 0, len = populates.length; i < len; i++){
    var name = populates[i],
      data = getProperty(obj, name),
      path = schema.path(name);

    if (!path) continue;

    if (path.type === Array){
      var childPath = path._nested[0],
        ref = childPath.ref;

      if (!ref || !database._hasModel(ref)) continue;

      var model = models[ref] = models[ref] || database.model(ref);
      setProperty(obj, name, model._createQuery(data));
    } else {
      var ref = path.ref;
      if (!ref || !database._hasModel(ref)) continue;

      var model = models[ref] = models[ref] || database.model(ref);
      setProperty(obj, name, model.get(data));
    }
  }

  return obj;
};

/**
 * Sets the path to populate.
 *
 * @param {String} name
 * @return {Query}
 * @api public
 */

Model.prototype.populate = function(name){
  return this._createQuery().populate(name);
};