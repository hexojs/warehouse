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
 * Boolean schema type.
 */
var SchemaTypeBoolean = /** @class */ (function (_super) {
    __extends(SchemaTypeBoolean, _super);
    function SchemaTypeBoolean() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Casts a boolean.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeBoolean.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        if (value === 'false' || value === '0')
            return false;
        return Boolean(value);
    };
    /**
     * Validates a boolean.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Boolean|Error}
     */
    SchemaTypeBoolean.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (value != null && typeof value !== 'boolean') {
            throw new ValidationError("`" + value + "` is not a boolean!");
        }
        return value;
    };
    /**
     * Parses data and transform them into boolean values.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeBoolean.prototype.parse = function (value, data) {
        return Boolean(value);
    };
    /**
     * Transforms data into number to compress the size of database files.
     *
     * @param {Boolean} value
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeBoolean.prototype.value = function (value, data) {
        return +value;
    };
    return SchemaTypeBoolean;
}(SchemaType));
module.exports = SchemaTypeBoolean;
