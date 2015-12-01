'use strict';

var util = require('../util');
var WarehouseError = require('../error');

function PopulationError(msg) {
  WarehouseError.call(this);

  this.name = 'PopulationError';
  this.message = msg;
}

util.inherits(PopulationError, WarehouseError);

module.exports = PopulationError;
