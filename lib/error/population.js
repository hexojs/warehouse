'use strict';

var util = require('../util');
var WarehouseError = require('../error');

function PopulationError(msg){
  Error.call(this);
  Error.captureStackTrace && Error.captureStackTrace(this, PopulationError);

  this.name = 'PopulationError';
  this.message = msg;
}

util.inherits(PopulationError, WarehouseError);

module.exports = PopulationError;