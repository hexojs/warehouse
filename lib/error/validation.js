'use strict';

var util = require('../util');
var WarehouseError = require('../error');

function ValidationError(msg) {
  WarehouseError.call(this);

  this.name = 'ValidationError';
  this.message = msg;
}

util.inherits(ValidationError, WarehouseError);

module.exports = ValidationError;
