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
var isArray = Array.isArray;
/**
 * Array schema type.
 */
var SchemaTypeArray = /** @class */ (function (_super) {
    __extends(SchemaTypeArray, _super);
    /**
     *
     * @param {String} name
     * @param {Object} [options]
     *   @param {Boolean} [options.required=false]
     *   @param {Array|Function} [options.default=[]]
     *   @param {SchemaType} [options.child]
     */
    function SchemaTypeArray(name, options) {
        var _this = _super.call(this, name, Object.assign({
            default: []
        }, options)) || this;
        _this.child = _this.options.child || new SchemaType(name);
        return _this;
    }
    /**
     * Casts an array and its child elements.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.cast = function (value_, data) {
        var value = _super.prototype.cast.call(this, value_, data);
        if (value == null)
            return value;
        if (!isArray(value))
            value = [value];
        if (!value.length)
            return value;
        var child = this.child;
        for (var i = 0, len = value.length; i < len; i++) {
            value[i] = child.cast(value[i], data);
        }
        return value;
    };
    /**
     * Validates an array and its child elements.
     *
     * @param {*} value
     * @param {Object} data
     * @return {Array|Error}
     */
    SchemaTypeArray.prototype.validate = function (value_, data) {
        var value = _super.prototype.validate.call(this, value_, data);
        if (!isArray(value)) {
            throw new ValidationError("`" + value + "` is not an array!");
        }
        if (!value.length)
            return value;
        var child = this.child;
        for (var i = 0, len = value.length; i < len; i++) {
            value[i] = child.validate(value[i], data);
        }
        return value;
    };
    /**
     * Compares an array by its child elements and the size of the array.
     *
     * @param {Array} a
     * @param {Array} b
     * @return {Number}
     */
    SchemaTypeArray.prototype.compare = function (a, b) {
        if (a) {
            if (!b)
                return 1;
        }
        else {
            return b ? -1 : 0;
        }
        var lenA = a.length;
        var lenB = b.length;
        var child = this.child;
        for (var i = 0, len = Math.min(lenA, lenB); i < len; i++) {
            var result = child.compare(a[i], b[i]);
            if (result !== 0)
                return result;
        }
        // Compare by length
        return lenA - lenB;
    };
    /**
     * Parses data.
     *
     * @param {Array} value
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.parse = function (value, data) {
        if (!value)
            return value;
        var len = value.length;
        if (!len)
            return [];
        var result = new Array(len);
        var child = this.child;
        for (var i = 0; i < len; i++) {
            result[i] = child.parse(value[i], data);
        }
        return result;
    };
    /**
     * Transforms data.
     *
     * @param {Array} value
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.value = function (value, data) {
        if (!value)
            return value;
        var len = value.length;
        if (!len)
            return [];
        var result = new Array(len);
        var child = this.child;
        for (var i = 0; i < len; i++) {
            result[i] = child.value(value[i], data);
        }
        return result;
    };
    /**
     * Checks the equality of an array.
     *
     * @param {Array} value
     * @param {Array} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeArray.prototype.match = function (value, query, data) {
        if (!value || !query) {
            return value === query;
        }
        var lenA = value.length;
        var lenB = query.length;
        if (lenA !== lenB)
            return false;
        var child = this.child;
        for (var i = 0; i < lenA; i++) {
            if (!child.match(value[i], query[i], data))
                return false;
        }
        return true;
    };
    /**
     * Checks whether the number of elements in an array is equal to `query`.
     *
     * @param {Array} value
     * @param {Number} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeArray.prototype.q$size = function (value, query, data) {
        return (value ? value.length : 0) === query;
    };
    /**
     * Checks whether an array contains one of elements in `query`.
     *
     * @param {Array} value
     * @param {Array} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeArray.prototype.q$in = function (value, query, data) {
        if (!value)
            return false;
        for (var i = 0, len = query.length; i < len; i++) {
            if (value.includes(query[i]))
                return true;
        }
        return false;
    };
    /**
     * Checks whether an array does not contain in any elements in `query`.
     *
     * @param {Array} value
     * @param {Array} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeArray.prototype.q$nin = function (value, query, data) {
        if (!value)
            return true;
        for (var i = 0, len = query.length; i < len; i++) {
            if (value.includes(query[i]))
                return false;
        }
        return true;
    };
    /**
     * Checks whether an array contains all elements in `query`.
     *
     * @param {Array} value
     * @param {Array} query
     * @param {Object} data
     * @return {Boolean}
     */
    SchemaTypeArray.prototype.q$all = function (value, query, data) {
        if (!value)
            return false;
        for (var i = 0, len = query.length; i < len; i++) {
            if (!value.includes(query[i]))
                return false;
        }
        return true;
    };
    /**
     * Add elements to an array.
     *
     * @param {Array} value
     * @param {*} update
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.u$push = function (value, update, data) {
        if (isArray(update)) {
            return value ? value.concat(update) : update;
        }
        if (value) {
            value.push(update);
            return value;
        }
        return [update];
    };
    /**
     * Add elements in front of an array.
     *
     * @param {Array} value
     * @param {*} update
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.u$unshift = function (value, update, data) {
        if (isArray(update)) {
            return value ? update.concat(value) : update;
        }
        if (value) {
            value.unshift(update);
            return value;
        }
        return [update];
    };
    /**
     * Removes elements from an array.
     *
     * @param {Array} value
     * @param {*} update
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.u$pull = function (value, update, data) {
        if (!value)
            return value;
        if (isArray(update)) {
            return value.filter(function (item) { return !update.includes(item); });
        }
        return value.filter(function (item) { return item !== update; });
    };
    /**
     * Removes the first element from an array.
     *
     * @param {Array} value
     * @param {Number|Boolean} update
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.u$shift = function (value, update, data) {
        if (!value || !update)
            return value;
        if (update === true) {
            return value.slice(1);
        }
        else if (update > 0) {
            return value.slice(update);
        }
        return value.slice(0, value.length + update);
    };
    /**
     * Removes the last element from an array.
     *
     * @param {Array} value
     * @param {Number|Boolean} update
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.u$pop = function (value, update, data) {
        if (!value || !update)
            return value;
        var length = value.length;
        if (update === true) {
            return value.slice(0, length - 1);
        }
        else if (update > 0) {
            return value.slice(0, length - update);
        }
        return value.slice(-update, length);
    };
    /**
     * Add elements to an array only if the value is not already in the array.
     *
     * @param {Array} value
     * @param {*} update
     * @param {Object} data
     * @return {Array}
     */
    SchemaTypeArray.prototype.u$addToSet = function (value, update, data) {
        if (isArray(update)) {
            if (!value)
                return update;
            for (var i = 0, len = update.length; i < len; i++) {
                var item = update[i];
                if (!value.includes(item))
                    value.push(item);
            }
            return value;
        }
        if (!value)
            return [update];
        if (!value.includes(update)) {
            value.push(update);
        }
        return value;
    };
    return SchemaTypeArray;
}(SchemaType));
SchemaTypeArray.prototype.q$length = SchemaTypeArray.prototype.q$size;
SchemaTypeArray.prototype.u$append = SchemaTypeArray.prototype.u$push;
SchemaTypeArray.prototype.u$prepend = SchemaTypeArray.prototype.u$unshift;
module.exports = SchemaTypeArray;
