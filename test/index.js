'use strict';

var chai = require('chai');

chai.should();
chai.use(require('chai-as-promised'));

describe('Warehouse', function() {
  require('./scripts/database');
  require('./scripts/document');
  require('./scripts/model');
  require('./scripts/query');
  require('./scripts/schema');
  require('./scripts/schematype');
  require('./scripts/types/array');
  require('./scripts/types/boolean');
  require('./scripts/types/cuid');
  require('./scripts/types/date');
  require('./scripts/types/enum');
  require('./scripts/types/integer');
  require('./scripts/types/number');
  require('./scripts/types/object');
  require('./scripts/types/string');
  require('./scripts/types/virtual');
  require('./scripts/util');
  require('./scripts/mutex');
});
