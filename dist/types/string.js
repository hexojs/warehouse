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
 * String schema type.
 */
var SchemaTypeString = /** @class */ (function (_super) {
    __extends(SchemaTypeString, _super);
    function SchemaTypeString() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Casts a string.
     *
     * @param {*} value
     * @param {Object} data
     * @return {String}
     */
    SchemaTypeString.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        if (value == null || typeof value === 'string')
            return value;
        if (typeof value.toString === 'function')
            return value.toString();
    };
    /**
     * Validates a string.
     *
     * @param {*} value
     * @param {Object} data
     * @return {String|Error}
     */
    SchemaTypeString.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (value !== undefined && typeof value !== 'string') {
            throw new ValidationError("`" + value + "` is not a string!");
        }
        return value;
    };
    /**
     * Checks the equality of data.
     *
     * @param {*} value
     * @param {String|RegExp} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeString.prototype.match = function (value, query, data) {
        if (!value || !query) {
            return value === query;
        }
        if (typeof query.test === 'function') {
            return query.test(value);
        }
        return value === query;
    };
    /**
     * Checks whether a string is equal to one of elements in `query`.
     *
     * @param {String} value
     * @param {Array} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeString.prototype.q$in = function (value, query, data) {
        for (var i = 0, len = query.length; i < len; i++) {
            if (this.match(value, query[i], data))
                return true;
        }
        return false;
    };
    /**
     * Checks whether a string is not equal to any elements in `query`.
     *
     * @param {String} value
     * @param {Array} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeString.prototype.q$nin = function (value, query, data) {
        return !this.q$in(value, query, data);
    };
    /**
     * Checks length of a string.
     *
     * @param {String} value
     * @param {Number} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeString.prototype.q$length = function (value, query, data) {
        return (value ? value.length : 0) === query;
    };
    return SchemaTypeString;
}(SchemaType));
module.exports = SchemaTypeString;
