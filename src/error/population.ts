import WarehouseError = require('../error');

class PopulationError extends WarehouseError {}

PopulationError.prototype.name = 'PopulationError';

export = PopulationError;
