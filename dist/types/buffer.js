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
var SchemaTypeBuffer = /** @class */ (function (_super) {
    __extends(SchemaTypeBuffer, _super);
    /**
     * @param {string} name
     * @param {object} [options]
     *   @param {boolean} [options.required=false]
     *   @param {boolean|Function} [options.default]
     *   @param {string} [options.encoding=hex]
     */
    function SchemaTypeBuffer(name, options) {
        return _super.call(this, name, Object.assign({
            encoding: 'hex'
        }, options)) || this;
    }
    /**
     * Casts data.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Buffer}
     */
    SchemaTypeBuffer.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        if (value == null || Buffer.isBuffer(value))
            return value;
        if (typeof value === 'string')
            return Buffer.from(value, this.options.encoding);
        if (Array.isArray(value))
            return Buffer.from(value);
    };
    /**
     * Validates data.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Buffer}
     */
    SchemaTypeBuffer.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (!Buffer.isBuffer(value)) {
            throw new ValidationError("`" + value + "` is not a valid buffer!");
        }
        return value;
    };
    /**
     * Compares between two buffers.
     *
     * @param {Buffer} a
     * @param {Buffer} b
     * @return {Number}
     */
    SchemaTypeBuffer.prototype.compare = function (a, b) {
        if (Buffer.isBuffer(a)) {
            return Buffer.isBuffer(b) ? a.compare(b) : 1;
        }
        return Buffer.isBuffer(b) ? -1 : 0;
    };
    /**
     * Parses data and transform them into buffer values.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeBuffer.prototype.parse = function (value, data) {
        return value ? Buffer.from(value, this.options.encoding) : value;
    };
    /**
     * Transforms data into number to compress the size of database files.
     *
     * @param {Buffer} value
     * @param {Object} data
     * @return {Number}
     */
    SchemaTypeBuffer.prototype.value = function (value, data) {
        return Buffer.isBuffer(value) ? value.toString(this.options.encoding) : value;
    };
    /**
     * Checks the equality of data.
     *
     * @param {Buffer} value
     * @param {Buffer} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeBuffer.prototype.match = function (value, query, data) {
        if (Buffer.isBuffer(value) && Buffer.isBuffer(query)) {
            return value.equals(query);
        }
        return value === query;
    };
    return SchemaTypeBuffer;
}(SchemaType));
module.exports = SchemaTypeBuffer;
