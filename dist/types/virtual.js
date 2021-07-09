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
var setGetter = require('../util').setGetter;
/**
 * Virtual schema type.
 */
var SchemaTypeVirtual = /** @class */ (function (_super) {
    __extends(SchemaTypeVirtual, _super);
    function SchemaTypeVirtual() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Add a getter.
     *
     * @param {Function} fn
     * @chainable
     */
    SchemaTypeVirtual.prototype.get = function (fn) {
        if (typeof fn !== 'function') {
            throw new TypeError('Getter must be a function!');
        }
        this.getter = fn;
        return this;
    };
    /**
     * Add a setter.
     *
     * @param {Function} fn
     * @chainable
     */
    SchemaTypeVirtual.prototype.set = function (fn) {
        if (typeof fn !== 'function') {
            throw new TypeError('Setter must be a function!');
        }
        this.setter = fn;
        return this;
    };
    /**
     * Applies getters.
     *
     * @param {*} value
     * @param {Object} data
     * @return {*}
     */
    SchemaTypeVirtual.prototype.cast = function (value, data) {
        if (typeof this.getter !== 'function')
            return;
        var getter = this.getter;
        var hasCache = false;
        var cache;
        setGetter(data, this.name, function () {
            if (!hasCache) {
                cache = getter.call(data);
                hasCache = true;
            }
            return cache;
        });
    };
    /**
     * Applies setters.
     *
     * @param {*} value
     * @param {Object} data
     */
    SchemaTypeVirtual.prototype.validate = function (value, data) {
        if (typeof this.setter === 'function') {
            this.setter.call(data, value);
        }
    };
    return SchemaTypeVirtual;
}(SchemaType));
module.exports = SchemaTypeVirtual;
