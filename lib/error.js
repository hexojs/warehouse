'use strict';

/**
 * WarehouseError constructor
 *
 * @class
 * @param {String} msg
 * @param {String} code
 * @extends Error
 */
class WarehouseError extends Error {
  constructor(msg, code) {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
    } else {
      this.stack = new Error().stack;
    }

    this.name = 'WarehouseError';
    this.message = msg;
    this.code = code;
  }
}

WarehouseError.ID_EXIST = 'ID_EXIST';
WarehouseError.ID_NOT_EXIST = 'ID_NOT_EXIST';
WarehouseError.ID_UNDEFINED = 'ID_UNDEFINED';

module.exports = WarehouseError;
