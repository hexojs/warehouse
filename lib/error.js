'use strict';

var util = require('./util');

function WarehouseError(msg){
  Error.call(this);
  Error.captureStackTrace && Error.captureStackTrace(this, WarehouseError);

  this.name = 'WarehouseError';
  this.message = msg;
}

util.inherits(WarehouseError, Error);

module.exports = WarehouseError;