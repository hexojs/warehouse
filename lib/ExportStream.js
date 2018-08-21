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
  const keys = this.ModelsKeys = Object.keys(models).filter(key => models[key] != null);
  const { length } = keys;

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
   *   All Pushed Models.
   * state: 4
   *   All Pushed(Ended).
   */
  this.state = -1;
  this.ExportedModelCount = 0;
  this.ModelsLength = length;
  this.meta = {
    version: db.options.version,
    warehouse: pkg.version
  };

  /**
   * use only state 2.
   * Stach exporting model.
   * @type {Model}
   */
  this.stashedModel = undefined;

  /**
   * use only state 2.
   * Stach exporting index.
   */
  this.stashedDatasIndex = -1;

  /**
   * use only state 2.
   * Stach exporting  datas.
   * @type {string[]|undefined}
   */
  this.stashedDatasKeys = undefined;
};

inherits(WarehouseExportReadableStream, Readable);

WarehouseExportReadableStream.prototype.stashModelDatas = function(model, keys, index) {
  this.state = 2;
  this.stashedModel = model;
  this.stashedDatasKeys = keys;
  this.stashedDatasIndex = index;
};

WarehouseExportReadableStream.prototype.drowStashedmodelDatas = function() {
  const model = this.stashedModel;
  const datasKeys = this.stashedDatasKeys;
  const index = this.stashedDatasIndex;

  this.stashedModel = undefined;
  this.stashedDatasKeys = undefined;
  this.stashedDatasIndex = -1;
  this.state = 0;

  return [model, datasKeys, index];
};

WarehouseExportReadableStream.prototype._read = function() {
  switch (this.state) {
    case -1:
      // Bigin Json Object And Bigin Meta
      this.push('{"meta":');
      this.push(JSON.stringify(this.meta));
      // End Meta And Bigin Models
      this.push(',"models":{');
      this.state = this.ModelsLength > 0 ? 0 : 3;
      return;
    case 1:
      // Models Concat
      this.push(',');
    case 0: // eslint-disable-line no-fallthrough
    case 2: {
      // Export Model
      let model, datasKeys, index;

      if (this.state === 2) {
        // Draw Stash
        [model, datasKeys, index] = this.drowStashedmodelDatas();
      } else {
        // first
        const key = this.ModelsKeys[this.ExportedModelCount];

        model = this.models[key];
        datasKeys = Object.keys(model.data).filter(id => model.has(id));
        index = -1;

        this.push('"'); // Bigin ModelName
        this.push(key);
        this.push('":['); // End ModelName And Key/Value Separator And Bigin Datas
      }

      const { length } = datasKeys;

      while (++index < length) {
        if (index > 0) this.push(','); // Datas Concat

        const doc = model.findById(datasKeys[index], { lean: true });
        const exportData = model.schema._exportDatabase(doc);

        if (!this.push(JSON.stringify(exportData))) {
          this.stashModelDatas(model, datasKeys, index);
          return;
        }
      }

      this.push(']'); // End Datas

      this.state = ++this.ExportedModelCount >= this.ModelsLength ? 3 : 1;
      return;
    }
    case 3:
      // End Models And End JSON Object
      this.push('}}');
      this.push(null);
      this.state = 4;
      return;
    case 4:
      return;
    default:
      this.emit('error', new Error('invalid State.'));
  }
};

module.exports = WarehouseExportReadableStream;
