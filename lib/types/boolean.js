/**
 * Module dependencies.
 */

var _ = require('lodash'),
  SchemaType = require('../schematype');

/**
 * Creates a new SchemaBoolean instance.
 *
 * @param {Object} [options]
 * @api public
 */

var SchemaBoolean = module.exports = function(options){
  SchemaType.call(this, options);
};

SchemaBoolean.type = SchemaBoolean.prototype.type = Boolean;

/**
 * Inherits from SchemaType.
 */

SchemaBoolean.prototype.__proto__ = SchemaType.prototype;

/**
 * Checks if the given `value` is a boolean.
 *
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaBoolean.prototype.checkRequired = function(value){
  return value === true || value === false;
};

/**
 * Casts the given `value` to a boolean.
 *
 * @param {any} value
 * @return {Boolean}
 * @api public
 */

SchemaBoolean.prototype.cast = function(value){
  if (value === null) return value;
  if ('0' === value) return false;
  if ('true' === value) return true;
  if ('false' === value) return false;

  return !!value;
};

/**
 * Inherits compare function from SchemaType.
 */

SchemaBoolean.compare = SchemaType.compare;


/**
 * Inherits query operators from SchemaType.
 */

SchemaBoolean.queryOperators = _.clone(SchemaType.queryOperators);

/**
 * Inherits update operators from SchemaType.
 */

SchemaBoolean.updateOperators = _.clone(SchemaType.updateOperators);