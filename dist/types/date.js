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
 * Date schema type.
 */
var SchemaTypeDate = /** @class */ (function (_super) {
    __extends(SchemaTypeDate, _super);
    function SchemaTypeDate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Casts data.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Date}
     */
    SchemaTypeDate.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        if (value == null || value instanceof Date)
            return value;
        return new Date(value);
    };
    /**
     * Validates data.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Date|Error}
     */
    SchemaTypeDate.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (value != null && (!(value instanceof Date) || isNaN(value.getTime()))) {
            throw new ValidationError("`" + value + "` is not a valid date!");
        }
        return value;
    };
    /**
     * Checks the equality of data.
     *
     * @param {Date} value
     * @param {Date} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeDate.prototype.match = function (value, query, data) {
        if (!value || !query) {
            return value === query;
        }
        return value.getTime() === query.getTime();
    };
    /**
     * Compares between two dates.
     *
     * @param {Date} a
     * @param {Date} b
     * @return {Number}
     */
    SchemaTypeDate.prototype.compare = function (a, b) {
        if (a) {
            return b ? a - b : 1;
        }
        return b ? -1 : 0;
    };
    /**
     * Parses data and transforms it into a date object.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Date}
     */
    SchemaTypeDate.prototype.parse = function (value, data) {
        if (value)
            return new Date(value);
    };
    /**
     * Transforms a date object to a string.
     *
     * @param {Date} value
     * @param {Object} data
     * @return {String}
     */
    SchemaTypeDate.prototype.value = function (value, data) {
        return value ? value.toISOString() : value;
    };
    /**
     * Finds data by its date.
     *
     * @param {Date} value
     * @param {Number} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeDate.prototype.q$day = function (value, query, data) {
        return value ? value.getDate() === query : false;
    };
    /**
     * Finds data by its month. (Start from 0)
     *
     * @param {Date} value
     * @param {Number} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeDate.prototype.q$month = function (value, query, data) {
        return value ? value.getMonth() === query : false;
    };
    /**
     * Finds data by its year. (4-digit)
     *
     * @param {Date} value
     * @param {Number} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeDate.prototype.q$year = function (value, query, data) {
        return value ? value.getFullYear() === query : false;
    };
    /**
     * Adds milliseconds to date.
     *
     * @param {Date} value
     * @param {Number} update
     * @param {Object} data
     * @return {Date}
     */
    SchemaTypeDate.prototype.u$inc = function (value, update, data) {
        if (value)
            return new Date(value.getTime() + update);
    };
    /**
     * Subtracts milliseconds from date.
     *
     * @param {Date} value
     * @param {Number} update
     * @param {Object} data
     * @return {Date}
     */
    SchemaTypeDate.prototype.u$dec = function (value, update, data) {
        if (value)
            return new Date(value.getTime() - update);
    };
    return SchemaTypeDate;
}(SchemaType));
module.exports = SchemaTypeDate;
