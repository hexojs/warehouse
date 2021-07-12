'use strict';

import WarehouseError from '../error';

class ValidationError extends WarehouseError {}

ValidationError.prototype.name = 'ValidationError';

export default ValidationError;
