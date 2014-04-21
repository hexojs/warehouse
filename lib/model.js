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
* The model constructor.
*
* @class Model
* @param {String} name
* @param {Schema|Object} schema
* @param {Database} database
* @constructor
* @module warehouse
*/

var Model = module.exports = function(name, schema, database){
  var self = this;

  /**
  * The name of the model.
  *
  * @property _name
  * @type String
  * @private
  */

  this._name = name;

  /**
  * The reference to the database.
  *
  * @property _database
  * @type Database
  * @private
  */

  this._database = database;

  /**
  * The reference to the store in the database.
  *
  * @property _store
  * @type Store
  * @private
  */

  this._store = database._store.get(name);

  /**
  * The index of the model.
  *
  * @property _index
  * @type Array
  * @private
  */

  this._index = [];

  /**
  * The schema of the model.
  *
  * @property schema
  * @type Schema
  * @private
  */

  this.schema = schema;

  for (var i in schema.statics){
    this[i] = schema.statics[i];
  }

  /**
  * The document constructor.
  *
  * @property _doc
  * @type Document
  * @private
  */

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

  /**
  * The query constructor.
  *
  * @property _query
  * @type Query
  * @private
  */

  var query = this._query = function(index){
    Query.call(this, index);
  };

  query.__proto__ = Query;
  query.prototype.__proto__ = Query.prototype;
  query.prototype._model = this;

  this._updateIndex();

  /**
  * Returns the number of items in the model.
  *
  * @property length
  * @type Number
  * @readOnly
  * @default 0
  */

  this.__defineGetter__('length', function(){
    return this.count();
  });

  /**
  * Fires when the model initialized.
  *
  * @event init
  */

  this.emit('init', this);
};

Model.prototype.__proto__ = EventEmitter.prototype;

/**
* Updates the index.
*
* @method _updateIndex
* @private
*/

Model.prototype._updateIndex = function(){
  var index = this._index,
    store = this._store.list();

  index.length = 0;

  for (var i in store){
    index.push(i);
  }
};

/**
* Creates a new query.
*
* @method _createQuery
* @param {Array} [index]
* @return {Query}
* @private
*/

Model.prototype._createQuery = function(index){
  if (!index) index = this._index.slice();

  return new this._query(index);
};

/**
* Checks if `id` is used.
*
* @method _checkID
* @param {String} id
* @return {Boolean}
* @private
*/

Model.prototype._checkID = function(id){
  return id ? this._index.indexOf(id) > -1 : false;
};

/**
* Creates a new document.
*
* @method new
* @param {Object} obj
* @return {Document}
*/

Model.prototype.new = function(obj){
  return new this._doc(obj);
};

/**
* Applies the schema.
*
* @method _applyGetter
* @param {Object} obj
* @param {String} name
* @param {any} value
* @param {String} [prefix]
* @return {Object}
* @private
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
* Finds a single document by id.
*
* @method get
* @param {String} id
* @return {Document}
*/

Model.prototype.get = function(id){
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
* Alias for {% crosslink Model.get %}
*
* @method findById
* @param {String} id
* @return {Document}
*/
Model.prototype.findById = Model.prototype.get;

/**
* Finds raw data of a single document by id.
*
* @method _getRaw
* @param {String} id
* @return {Object}
* @private
*/

Model.prototype._getRaw = function(id){
  return _.cloneDeep(this._store.get(id));
};

/**
* Iterates over the model.
*
* @method forEach
* @param {Function} iterator
* @chainable
*/

Model.prototype.forEach = Model.prototype.each = function(iterator){
  var index = this._index;

  for (var i = 0, len = index.length; i < len; i++){
    iterator(this.get(index[i]), i);
  }

  return this;
};

/**
* Alias for {% crosslink Model.forEach %}
*
* @method each
* @param {Function} iterator
* @chainable
*/
Model.prototype.each = Model.prototype.forEach;

/**
* Returns an array containing all items in the model.
*
* @method toArray
* @return {Array}
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
* @method count
* @return {Number}
*/

Model.prototype.count = function(){
  return this._index.length;
};

/**
* Alias for {% crosslink Model.count %}
*
* @method size
* @return {Number}
*/
Model.prototype.size = Model.prototype.count;

/**
* Applies the schema.
*
* @method _applySetter
* @param {Object} obj
* @param {String} name
* @param {any} value
* @param {String} [prefix]
* @return {Object}
* @private
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
* Saves a document to the model.
*
* @method _save
* @param {Object} obj
* @param {Function} callback
* @private
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

    self._store.set(obj._id, obj);
    self._updateIndex();

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
* Inserts a document to the model.
*
* @method insert
* @param {Object|Array} obj
* @param {Function} [callback]
* @chainable
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
    /**
    * Fires when a document inserted.
    *
    * @event insert
    * @param {Document} result
    */
    self.emit('insert', result);
    callback && callback(result);
  });

  return this;
};

/**
* Updates documents matching the `conditions` in the model.
* `conditions` can be either a query object or the id of the document.
*
* @method update
* @param {Object|String} conditions
* @param {Object} obj
* @param {Function} [callback]
* @chainable
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
* @method _update
* @param {Object} data
* @param {Object} obj
* @return {Object}
* @private
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
* Updates a document in the model by id.
*
* @method updateById
* @param {String} id
* @param {Object} obj
* @param {Function} [callback]
* @chainable
*/

Model.prototype.updateById = function(id, obj, callback){
  if (!this._checkID(id)){
    callback && callback();
    return this;
  }

  var self = this;

  delete obj._id;

  this._save(this._update(this._getRaw(id), obj), function(result){
    /**
    * Fires when a document updated.
    *
    * @event update
    * @param {Document} result
    */
    self.emit('update', result);
    callback && callback(result);
  });

  return this;
};

/**
* Replaces documents matching the `conditions` in the model.
* `conditions` can be either a query object or the id of the document.
*
* @method replace
* @param {Object} conditions
* @param {Object} obj
* @param {Function} [callback]
* @chainable
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
* Replaces a document in the model by id.
*
* @method replaceById
* @param {Number} id
* @param {Object} obj
* @param {Function} [callback]
* @chainable
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
* Removes documents matching the `conditions` in the model.
* `conditions` can be either a query object or the id of the document.
*
* @method remove
* @param {Object|String} conditions
* @param {Function} [callback]
* @chainable
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
* Removes a document in the model by id.
*
* @method removeById
* @param {Number} id
* @param {Function} [callback]
* @chainable
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

    self._store.remove(id);
    self._updateIndex();

    /**
    * Fires when a document removed.
    *
    * @event remove
    * @param {Document} doc
    */

    self.emit('remove', doc);
    callback && callback(doc);

    var hooks = schema.posts.remove;

    for (var i = 0, len = hooks.length; i < len; i++){
      hooks[i](doc);
    }
  });

  return this;
};

/**
* Saves a document to the model.
*
* @method save
* @param {Object} obj
* @param {Function} [callback]
* @chainable
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
* Deletes all documents in the model.
*
* @method destroy
* @chainable
*/

Model.prototype.destroy = function(){
  this._store.destroy();
  this._index.length = 0;

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

Model.prototype.eq = function(num){
  if (this.length){
    if (num < 0) num = this.length + num;
    return this.get(this._index[num]);
  }
};

/**
* Returns the first document in the model.
*
* This method is an alias of:
*
* ``` js
* model.eq(0);
* ```
*
* @method first
* @return {Document}
*/

Model.prototype.first = function(){
  return this.eq(0);
};

/**
* Returns the last document in the model.
*
* This method is an alias of:
*
* ``` js
* model.eq(-1);
* ```
*
* @method last
* @return {Document}
*/

Model.prototype.last = function(){
  return this.eq(-1);
};

/**
* Returns the specified range of documents in the model.
*
* @method slice
* @param {Number} start
* @param {Number} [end]
* @return {Query}
*/

Model.prototype.slice = function(start, end){
  return this._createQuery().slice(start, end);
};

/**
* Limits the number of items returned.
*
* This method is an alias of:
*
* ``` js
* model.slice(0, num);
* ```
*
* @method limit
* @param {Number} num
* @return {Query}
*/

Model.prototype.limit = function(num){
  return this.slice(0, num);
};

/**
* Specifies the number of items to skip.
*
* This method is an alias of:
*
* ``` js
* model.slice(num);
* `
*
* @method skip
* @param {Number} num
* @return {Query}
*/

Model.prototype.skip = function(num){
  return this.slice(num);
};

/**
* Returns the model in reversed order.
*
* @method reverse
* @return {Query}
*/

Model.prototype.reverse = function(){
  return this._createQuery().reverse();
};

/**
* Sorts the documents in the model.
*
* See {% crosslink Query/sort %}
*
* @method sort
* @param {String|Object} orderby
* @param {Number|String} [order]
* @return {Query}
*/

Model.prototype.sort = function(orderby, order){
  var query = this._createQuery();

  return query.sort(orderby, order);
};

/**
* Returns the documents in the model in random order.
*
* @method random
* @return {Query}
*/

Model.prototype.random = function(){
  return this._createQuery().random();
};

/**
* Alias for {% crosslink Model.random %}
*
* @method shuffle
* @return {Query}
*/
Model.prototype.shuffle = Model.prototype.random;

/**
* Finds the matching documents in the model.
*
* See {% crosslink Query/find %}
*
* @method find
* @param {Object} conditions
* @param {Object} [options]
* @return {Query}
*/

Model.prototype.find = function(conditions, options){
  return this._createQuery().find(conditions, options);
};

/**
* Finds the first matching document.
*
* @method findOne
* @param {Object} conditions
* @return {Document}
*/

Model.prototype.findOne = function(conditions){
  return this.find(conditions, {limit: 1}).first();
};

/**
* Popluates document references.
*
* @method _populate
* @param {Object} obj
* @param {Array} populates
* @return {Object}
* @private
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
* @method populate
* @param {String} name
* @return {Query}
*/

Model.prototype.populate = function(name){
  return this._createQuery().populate(name);
};

/**
* Creates an array of values by iterating each element in the collection.
*
* @method map
* @param {Function|String} callback
* @return {Array}
*/
Model.prototype.map = function(callback){
  return this._createQuery().map(callback);
};

/**
* Reduces a collection to a value which is the accumulated result of iterating each element in the collection.
*
* @method reduce
* @param {Function} callback
* @param {Any} [initial] Initial value
* @return {Any}
*/
Model.prototype.reduce = function(callback, initial){
  return this._createQuery().reduce(callback, initial);
};

/**
* Reduces a collection to a value which is the accumulated result of iterating each element in the collection from right to left.
*
* @method reduceRight
* @param {Function} callback
* @param {Any} [initial] Initial value
* @return {Any}
*/
Model.prototype.reduceRight = function(callback, initial){
  return this._createQuery().reduceRight(callback, initial);
};

/**
* Iterates over the query and returns all elements the callback returns truey for.
*
* @method filter
* @param {Function} callback
* @return {Query}
*/
Model.prototype.filter = function(callback){
  return this._createQuery().filter(callback);
};