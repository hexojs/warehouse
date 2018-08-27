'use strict';
const pkg = require('../package.json');
const { Readable } = require('stream');
const { inherits } = require('util');

/**
 * @class
 * @extends Readable
 * @param {Database} db
 * @internal
 */
const WarehouseExportReadableStream = function(db) {
  Readable.call(this);
  const models = this.models = db._models;
  const keys = this.ModelsKeys = Object.keys(models).filter(
    key => models[key] != null
  );
  this.ModelsLength = keys.length;

  /**
   * state: -1
   *   No Pushed.
   * state: 0
   *   Pushed Meta.
   * state: 1
   *   Partial Pushed Models.
   * state: 2
   *   Model has been pausing during export.
   * state: 3
   *   All Pushed(Ended).
   */
  this.state = -1;
  this.ExportedModelCount = 0;
  this.meta = {
    version: db.options.version,
    warehouse: pkg.version
  };

  /**
   * use only state 2.
   * Stach exporting datas
   * @type {Iterator<any>}
   */
  this.stashedIterator = undefined;
};

inherits(WarehouseExportReadableStream, Readable);

WarehouseExportReadableStream.prototype.readMeta = function() {
  // Bigin Meta
  this.push('"meta":');
  this.push(JSON.stringify(this.meta));
  // End Meta
  this.push(',');
};

/**
 *
 * @return {boolean} isComplated.
 */
WarehouseExportReadableStream.prototype.readModel = function() {

  // Draw Stash
  let iterator = this.stashedIterator;
  this.stashedIterator = undefined;

  let isFirst = iterator === undefined;

  if (isFirst) {
    iterator = this.models[this.getCurrentModelId()]._exportIterator();
  }

  /** @type {IteratorResult<any>} */
  let iterResult = null;

  while (!(iterResult = iterator.next()).done) {
    if (!isFirst) {
      this.push(','); // Datas Concat
    } else {
      isFirst = false;
    }

    if (!this.push(JSON.stringify(iterResult.value))) {
      // Stach
      this.stashedIterator = iterator;
      return false;
    }
  }
  ++this.ExportedModelCount;
  return true;
};

WarehouseExportReadableStream.prototype.isAllModelsExported = function() {
  return this.ExportedModelCount >= this.ModelsLength;
};

WarehouseExportReadableStream.prototype.getCurrentModelId = function() {
  return this.ModelsKeys[this.ExportedModelCount];
};

WarehouseExportReadableStream.prototype.moveState = function() {
  if (this.isAllModelsExported()) {
    this.state = 3;
    return;
  }
  if (this.stashedIterator !== undefined) {
    this.state = 2;
    return;
  }

  this.state = this.ExportedModelCount > 0 ? 1 : 0;
};

WarehouseExportReadableStream.prototype._read = function() {
  switch (this.state) {
    case -1:
      // Bigin Json Object
      this.push('{');
      this.readMeta();
      // Bigin Models
      this.push('"models":{');
      break;
    case 1:
      // Models Concat
      this.push(',');
    case 0: // eslint-disable-line no-fallthrough
      // Bigin ModelName
      this.push('"');

      this.push(this.getCurrentModelId());

      // End ModelName And Key/Value Separator And Bigin Datas
      this.push('":[');
    case 2: // eslint-disable-line no-fallthrough
      // Export Model
      if (this.readModel()) { // Complated
        this.push(']'); // End Datas
      }
      break;
    case 3:
      return; // Nothing.
    default:
      this.emit('error', new Error('invalid State.'));
  }
  if (this.isAllModelsExported()) {
    // End Models And End JSON Object
    this.push('}}');
    this.push(null);
  }
  this.moveState();
};

module.exports = WarehouseExportReadableStream;
