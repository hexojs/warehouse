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
 * Enum schema type.
 */
var SchemaTypeEnum = /** @class */ (function (_super) {
    __extends(SchemaTypeEnum, _super);
    /**
     *
     * @param {String} name
     * @param {Object} options
     *   @param {Boolean} [options.required=false]
     *   @param {Array} options.elements
     *   @param {*} [options.default]
     */
    function SchemaTypeEnum(name, options) {
        return _super.call(this, name, Object.assign({
            elements: []
        }, options)) || this;
    }
    /**
     * Validates data. The value must be one of elements set in the options.
     *
     * @param {*} value
     * @param {Object} data
     * @return {*}
     */
    SchemaTypeEnum.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        var elements = this.options.elements;
        if (!elements.includes(value)) {
            throw new ValidationError("The value must be one of " + elements.join(', '));
        }
        return value;
    };
    return SchemaTypeEnum;
}(SchemaType));
module.exports = SchemaTypeEnum;
