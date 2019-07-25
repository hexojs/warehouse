'use strict';

const util = require('../util');
const WarehouseError = require('../error');

/**
 * ValidationError constructor
 *
 * @class
 * @param {String} msg
 * @extends WarehouseError
 */
function ValidationError(msg) {
  WarehouseError.call(this);

  this.name = 'ValidationError';
  this.message = msg;
}

util.inherits(ValidationError, WarehouseError);

module.exports = ValidationError;
