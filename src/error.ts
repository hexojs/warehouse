class WarehouseError extends Error {
  code?: string;

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
  static ID_EXIST = 'ID_EXIST';
  static ID_NOT_EXIST = 'ID_NOT_EXIST';
  static ID_UNDEFINED = 'ID_UNDEFINED';
}

WarehouseError.prototype.name = 'WarehouseError';

export default WarehouseError;
