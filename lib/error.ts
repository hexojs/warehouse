'use strict';

class WarehouseError extends Error {
  code: string;
  static ID_EXIST: string;
  static ID_NOT_EXIST: string;
  static ID_UNDEFINED: string;

  /**
   * WarehouseError constructor
   *
   * @param {string} msg
   * @param {string} code
   */
  constructor(msg: string, code?: string) {
    super(msg);

    Error.captureStackTrace(this);

    this.code = code;
  }
}

WarehouseError.prototype.name = 'WarehouseError';
WarehouseError.ID_EXIST = 'ID_EXIST';
WarehouseError.ID_NOT_EXIST = 'ID_NOT_EXIST';
WarehouseError.ID_UNDEFINED = 'ID_UNDEFINED';

export default WarehouseError;
