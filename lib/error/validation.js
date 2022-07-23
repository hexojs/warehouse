import WarehouseError from '../error.js';

class ValidationError extends WarehouseError {}

ValidationError.prototype.name = 'ValidationError';

export default ValidationError;
