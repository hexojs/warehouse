'use strict';

const WarehouseError = require('../error');

class PopulationError extends WarehouseError {

  /**
   * PopulationError constructor
   *
   * @class
   * @param {String} msg
   * @extends WarehouseError
   */
  constructor(msg) {
    super();

    this.name = 'PopulationError';
    this.message = msg;
  }
}

module.exports = PopulationError;
