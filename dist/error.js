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
var WarehouseError = /** @class */ (function (_super) {
    __extends(WarehouseError, _super);
    /**
     * WarehouseError constructor
     *
     * @param {string} msg
     * @param {string} code
     */
    function WarehouseError(msg, code) {
        var _this = _super.call(this, msg) || this;
        Error.captureStackTrace(_this);
        _this.code = code;
        return _this;
    }
    return WarehouseError;
}(Error));
WarehouseError.prototype.name = 'WarehouseError';
WarehouseError.ID_EXIST = 'ID_EXIST';
WarehouseError.ID_NOT_EXIST = 'ID_NOT_EXIST';
WarehouseError.ID_UNDEFINED = 'ID_UNDEFINED';
module.exports = WarehouseError;
