import WarehouseError = require('../error');

class ValidationError extends WarehouseError {}

ValidationError.prototype.name = 'ValidationError';

export = ValidationError;
