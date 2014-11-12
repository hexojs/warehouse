'use strict';

var util = require('../util');
var WarehouseError = require('../error');

function ValidationError(msg){
  Error.call(this);
  Error.captureStackTrace && Error.captureStackTrace(this, ValidationError);

  this.name = 'ValidationError';
  this.message = msg;
}

util.inherits(ValidationError, WarehouseError);

module.exports = ValidationError;