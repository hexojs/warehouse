'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var JSONStream = require('JSONStream');
var Promise = require('bluebird');
var fs = require('graceful-fs');
var Model = require('./model');
var Schema = require('./schema');
var SchemaType = require('./schematype');
var WarehouseError = require('./error');
var pkg = require('../package.json');
var open = fs.promises.open;
var pipeline = Promise.promisify(require('stream').pipeline);
var _writev;
if (typeof fs.writev === 'function') {
    _writev = function (handle, buffers) { return handle.writev(buffers); };
}
else {
    _writev = function (handle, buffers) { return __awaiter(void 0, void 0, void 0, function () {
        var _i, buffers_1, buffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, buffers_1 = buffers;
                    _a.label = 1;
                case 1:
                    if (!(_i < buffers_1.length)) return [3 /*break*/, 4];
                    buffer = buffers_1[_i];
                    return [4 /*yield*/, handle.write(buffer)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    }); };
}
function exportAsync(database, path) {
    return __awaiter(this, void 0, void 0, function () {
        var handle, models, keys, length_1, i, key, buffers;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, open(path, 'w')];
                case 1:
                    handle = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 9, 11]);
                    // Start body & Meta & Start models
                    return [4 /*yield*/, handle.write("{\"meta\":" + JSON.stringify({
                            version: database.options.version,
                            warehouse: pkg.version
                        }) + ",\"models\":{")];
                case 3:
                    // Start body & Meta & Start models
                    _a.sent();
                    models = database._models;
                    keys = Object.keys(models);
                    length_1 = keys.length;
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < length_1)) return [3 /*break*/, 7];
                    key = keys[i];
                    if (!models[key])
                        return [3 /*break*/, 6];
                    buffers = [];
                    if (i)
                        buffers.push(Buffer.from(',', 'ascii'));
                    buffers.push(Buffer.from("\"" + key + "\":"));
                    buffers.push(Buffer.from(models[key]._export()));
                    return [4 /*yield*/, _writev(handle, buffers)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7: 
                // End models
                return [4 /*yield*/, handle.write('}}')];
                case 8:
                    // End models
                    _a.sent();
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, handle.close()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
var Database = /** @class */ (function () {
    /**
     * Database constructor.
     *
     * @param {object} [options]
     *   @param {number} [options.version=0] Database version
     *   @param {string} [options.path] Database path
     *   @param {function} [options.onUpgrade] Triggered when the database is upgraded
     *   @param {function} [options.onDowngrade] Triggered when the database is downgraded
     */
    function Database(options) {
        this.options = Object.assign({
            version: 0,
            onUpgrade: function () { },
            onDowngrade: function () { }
        }, options);
        this._models = {};
        var _Model = /** @class */ (function (_super) {
            __extends(_Model, _super);
            function _Model() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return _Model;
        }(Model));
        this.Model = _Model;
        _Model.prototype._database = this;
    }
    /**
     * Creates a new model.
     *
     * @param {string} name
     * @param {Schema|object} [schema]
     * @return {Model}
     */
    Database.prototype.model = function (name, schema) {
        if (this._models[name]) {
            return this._models[name];
        }
        this._models[name] = new this.Model(name, schema);
        var model = this._models[name];
        return model;
    };
    /**
     * Loads database.
     *
     * @param {function} [callback]
     * @return {Promise}
     */
    Database.prototype.load = function (callback) {
        var _this = this;
        var _a = this.options, path = _a.path, onUpgrade = _a.onUpgrade, onDowngrade = _a.onDowngrade, newVersion = _a.version;
        if (!path)
            throw new WarehouseError('options.path is required');
        var oldVersion = 0;
        var getMetaCallBack = function (data) {
            if (data.meta && data.meta.version) {
                oldVersion = data.meta.version;
            }
        };
        // data event arg0 wrap key/value pair.
        var parseStream = JSONStream.parse('models.$*');
        parseStream.once('header', getMetaCallBack);
        parseStream.once('footer', getMetaCallBack);
        parseStream.on('data', function (data) {
            _this.model(data.key)._import(data.value);
        });
        var rs = fs.createReadStream(path, 'utf8');
        return pipeline(rs, parseStream).then(function () {
            if (newVersion > oldVersion) {
                return onUpgrade(oldVersion, newVersion);
            }
            else if (newVersion < oldVersion) {
                return onDowngrade(oldVersion, newVersion);
            }
        }).asCallback(callback);
    };
    /**
     * Saves database.
     *
     * @param {function} [callback]
     * @return {Promise}
     */
    Database.prototype.save = function (callback) {
        var path = this.options.path;
        if (!path)
            throw new WarehouseError('options.path is required');
        return Promise.resolve(exportAsync(this, path)).asCallback(callback);
    };
    Database.prototype.toJSON = function () {
        var _this = this;
        var models = Object.keys(this._models)
            .reduce(function (obj, key) {
            var value = _this._models[key];
            if (value != null)
                obj[key] = value;
            return obj;
        }, {});
        return {
            meta: {
                version: this.options.version,
                warehouse: pkg.version
            },
            models: models
        };
    };
    return Database;
}());
Database.prototype.Schema = Schema;
Database.Schema = Database.prototype.Schema;
Database.prototype.SchemaType = SchemaType;
Database.SchemaType = Database.prototype.SchemaType;
Database.version = pkg.version;
module.exports = Database;
