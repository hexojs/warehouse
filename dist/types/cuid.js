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
var cuid = require('cuid');
var ValidationError = require('../error/validation');
/**
 * [CUID](https://github.com/ericelliott/cuid) schema type.
 */
var SchemaTypeCUID = /** @class */ (function (_super) {
    __extends(SchemaTypeCUID, _super);
    function SchemaTypeCUID() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Casts data. Returns a new CUID only if value is null and the field is
     * required.
     *
     * @param {String} value
     * @param {Object} data
     * @return {String}
     */
    SchemaTypeCUID.prototype.cast = function (value, data) {
        if (value == null && this.options.required) {
            return cuid();
        }
        return value;
    };
    /**
     * Validates data. A valid CUID must be started with `c` and 25 in length.
     *
     * @param {*} value
     * @param {Object} data
     * @return {String|Error}
     */
    SchemaTypeCUID.prototype.validate = function (value, data) {
        if (value && (value[0] !== 'c' || value.length !== 25)) {
            throw new ValidationError("`" + value + "` is not a valid CUID");
        }
        return value;
    };
    return SchemaTypeCUID;
}(SchemaType));
module.exports = SchemaTypeCUID;
