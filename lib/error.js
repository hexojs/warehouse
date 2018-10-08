'use strict';

class WarehouseError extends Error {

  /**
   * WarehouseError constructor
   *
   * @param {string} msg
   * @param {string} code
   */
  constructor(msg, code) {
    super(msg);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this);
    } else {
      this.stack = new Error().stack;
    }

    this.name = 'WarehouseError';
    this.code = code;
  }
}

WarehouseError.ID_EXIST = 'ID_EXIST';
WarehouseError.ID_NOT_EXIST = 'ID_NOT_EXIST';
WarehouseError.ID_UNDEFINED = 'ID_UNDEFINED';

module.exports = WarehouseError;
