'use strict';

const { setProp } = require('./util');
const ValidationError = require('./error/validation');

class SchemaType {

  /**
   * SchemaType constructor.
   *
   * This is the basic schema type. All schema types should inherit from this
   * class. For example:
   *
   ``` js
   class SchemaTypeCustom extends SchemaType {
     constructor(name, options) {
       super(name, options);
     }
   }
   ```
   *
   * **Query operators**
   *
   * To add a query operator, defines a method whose name is started with `q$`.
   * For example:
   *
   * ``` js
   * SchemaTypeCustom.q$foo = function(value, query, data){
   *   // ...
   * };
   * ```
   *
   * The `value` parameter is the value of specified field; the `query` parameter
   * is the value passed to the query operator; the `data` parameter is the
   * complete data.
   *
   * The return value must be a boolean indicating whether the data passed.
   *
   * **Update operators**
   *
   * To add a update operator, defines a method whose name is started with `u$`.
   * For example:
   *
   * ``` js
   * SchemaTypeCustom.u$foo = function(value, update, data){
   *   // ...
   * };
   *
   * The `value` parameter is the value of specified field; the `update` parameter
   * is the value passed to the update operator; the `data` parameter is the
   * complete data.
   *
   * The return value will replace the original data.
   *
   * @param {string} name
   * @param {object} [options]
   *   @param {boolean} [options.required=false]
   *   @param {*} [options.default]
   */
  constructor(name = '', options) {
    this.name = name;

    this.options = Object.assign({
      required: false
    }, options);

    const default_ = this.options.default;

    if (typeof default_ === 'function') {
      this.default = default_;
    } else {
      this.default = () => default_;
    }
  }
}

/**
 * Casts data. This function is used by getters to cast an object to document
 * instances. If the value is null, the default value will be returned.
 *
 * @param {*} value
 * @param {Object} data
 * @return {*}
 */
SchemaType.prototype.cast = function(value, data) {
  if (value == null) {
    return this.default();
  }

  return value;
};

/**
 * Validates data. This function is used by setters.
 *
 * @param {*} value
 * @param {Object} data
 * @return {*|Error}
 */
SchemaType.prototype.validate = function(value, data) {
  if (this.options.required && value == null) {
    throw new ValidationError(`\`${this.name}\` is required!`);
  }

  return value;
};

/**
 * Compares data. This function is used when sorting.
 *
 * @param {*} a
 * @param {*} b
 * @return {Number}
 */
SchemaType.prototype.compare = (a, b) => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  }

  return 0;
};

/**
 * Parses data. This function is used when restoring data from database files.
 *
 * @param {*} value
 * @param {Object} data
 * @return {*}
 */
SchemaType.prototype.parse = (value, data) => value;

/**
 * Transforms value. This function is used when saving data to database files.
 *
 * @param {*} value
 * @param {Object} data
 * @return {*}
 */
SchemaType.prototype.value = (value, data) => value;

/**
 * Checks the equality of data.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.match = (value, query, data) => value === query;

/**
 * Checks the existance of data.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$exist = (value, query, data) => (value != null) === query;

SchemaType.prototype.q$exists = SchemaType.prototype.q$exist;

/**
 * Checks the equality of data. Returns true if the value doesn't match.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {boolean}
 */
SchemaType.prototype.q$ne = function(value, query, data) {
  return !this.match(value, query, data);
};

/**
 * Checks whether `value` is less than (i.e. <) the `query`.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$lt = (value, query, data) => value < query;

/**
 * Checks whether `value` is less than or equal to (i.e. <=) the `query`.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$lte = (value, query, data) => value <= query;

SchemaType.prototype.q$max = SchemaType.prototype.q$lte;

/**
 * Checks whether `value` is greater than (i.e. >) the `query`.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$gt = (value, query, data) => value > query;

/**
 * Checks whether `value` is greater than or equal to (i.e. >=) the `query`.
 *
 * @param {*} value
 * @param {*} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$gte = (value, query, data) => value >= query;

SchemaType.prototype.q$min = SchemaType.prototype.q$gte;

/**
 * Checks whether `value` is equal to one of elements in `query`.
 *
 * @param {*} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$in = (value, query, data) => query.includes(value);

/**
 * Checks whether `value` is not equal to any elements in `query`.
 *
 * @param {*} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaType.prototype.q$nin = (value, query, data) => !query.includes(value);

/**
 * Sets the value.
 *
 * @param {*} value
 * @param {*} update
 * @param {Object} data
 * @return {*}
 */
SchemaType.prototype.u$set = (value, update, data) => update;

/**
 * Unsets the value.
 *
 * @param {*} value
 * @param {*} update
 * @param {Object} data
 * @return {*}
 */
SchemaType.prototype.u$unset = (value, update, data) => { return update ? undefined : value; };

/**
 * Renames a field.
 *
 * @param {*} value
 * @param {*} update
 * @param {Object} data
 * @return {*}
 */
SchemaType.prototype.u$rename = (value, update, data) => {
  if (value !== undefined) setProp(data, update, value);
  return undefined;
};

module.exports = SchemaType;
