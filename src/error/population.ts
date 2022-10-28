import WarehouseError from '../error';

class PopulationError extends WarehouseError {}

PopulationError.prototype.name = 'PopulationError';

export default PopulationError;
