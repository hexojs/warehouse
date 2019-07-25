'use strict';

const WarehouseError = require('../error');

class ValidationError extends WarehouseError {

  /**
   * ValidationError constructor
   *
   * @param {String} msg
   */
  constructor(msg) {
    super();

    this.name = 'ValidationError';
    this.message = msg;
  }
}

module.exports = ValidationError;
