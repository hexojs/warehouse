'use strict';

const WarehouseError = require('../error');

class PopulationError extends WarehouseError {

  /**
   * PopulationError constructor
   *
   * @param {string} msg
   */
  constructor(msg) {
    super(msg);

    this.name = 'PopulationError';
  }
}

module.exports = PopulationError;
