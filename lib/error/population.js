import WarehouseError from '../error.js';

class PopulationError extends WarehouseError {}

PopulationError.prototype.name = 'PopulationError';

export default PopulationError;
