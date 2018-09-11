'use strict';

const WarehouseError = require('../error');

/**
 * PopulationError constructor
 *
 * @class
 * @param {String} msg
 * @extends WarehouseError
 */
class PopulationError extends WarehouseError {
  constructor(msg) {
    super();
    this.name = 'PopulationError';
    this.message = msg;
  }
}

module.exports = PopulationError;
