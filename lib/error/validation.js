'use strict';

var util = require('../util'),
  WarehouseError = require('../error');

function ValidationError(msg){
  Error.call(this);
  Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);

  this.name = 'ValidationError';
  this.message = msg;
}

util.inherits(ValidationError, WarehouseError);

module.exports = ValidationError;