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
var SchemaType = require('../schematype');
var ValidationError = require('../error/validation');
/**
 * Number schema type.
 */
var SchemaTypeNumber = /** @class */ (function (_super) {
    __extends(SchemaTypeNumber, _super);
    function SchemaTypeNumber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Casts a number.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        if (value == null || typeof value === 'number')
            return value;
        return +value;
    };
    /**
     * Validates a number.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Number|Error}
     */
    SchemaTypeNumber.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
            throw new ValidationError("`" + value + "` is not a number!");
        }
        return value;
    };
    /**
     * Adds value to a number.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$inc = function (value, update, data) {
        return value ? value + update : update;
    };
    /**
     * Subtracts value from a number.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$dec = function (value, update, data) {
        return value ? value - update : -update;
    };
    /**
     * Multiplies value to a number.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$mul = function (value, update, data) {
        return value ? value * update : 0;
    };
    /**
     * Divides a number by a value.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$div = function (value, update, data) {
        return value ? value / update : 0;
    };
    /**
     * Divides a number by a value and returns the remainder.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$mod = function (value, update, data) {
        return value ? value % update : 0;
    };
    /**
     * Updates a number if the value is greater than the current value.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$max = function (value, update, data) {
        return update > value ? update : value;
    };
    /**
     * Updates a number if the value is less than the current value.
     *
     * @param {Number} value
     * @param {Number} update
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeNumber.prototype.u$min = function (value, update, data) {
        return update < value ? update : value;
    };
    return SchemaTypeNumber;
}(SchemaType));
module.exports = SchemaTypeNumber;
