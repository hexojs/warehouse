'use strict';

const WarehouseError = require('../error');

class ValidationError extends WarehouseError {

  /**
   * ValidationError constructor
   *
   * @param {string} msg
   */
  constructor(msg) {
    super(msg);

    this.name = 'ValidationError';
  }
}

module.exports = ValidationError;
