'use strict';

const WarehouseError = require('../error');

/**
 * ValidationError constructor
 *
 * @class
 * @param {String} msg
 * @extends WarehouseError
 */
class ValidationError extends WarehouseError {
  constructor(msg) {
    super(msg);

    this.name = 'ValidationError';
  }
}

module.exports = ValidationError;
