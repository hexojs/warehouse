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
var SchemaTypeNumber = require('./number');
var ValidationError = require('../error/validation');
/**
 * Integer schema type.
 */
var SchemaTypeInteger = /** @class */ (function (_super) {
    __extends(SchemaTypeInteger, _super);
    function SchemaTypeInteger() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Casts a integer.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeInteger.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        return parseInt(value, 10);
    };
    /**
     * Validates an integer.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Number|Error}
     */
    SchemaTypeInteger.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (value % 1 !== 0) {
            throw new ValidationError("`" + value + "` is not an integer!");
        }
        return value;
    };
    return SchemaTypeInteger;
}(SchemaTypeNumber));
module.exports = SchemaTypeInteger;
