'use strict';

var should = require('chai').should(); // eslint-disable-line
var ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeString', function() {
  var SchemaTypeString = require('../../../lib/types/string');
  var type = new SchemaTypeString('test');

  it('cast()', function() {
    type.cast('foo').should.eql('foo');
    type.cast(42).should.eql('42');
    type.cast(true).should.eql('true');
    type.cast([1, 2, 3]).should.eql('1,2,3');
    type.cast({}).should.eql('[object Object]');
    type.cast({
      toString: function() {
        return 'baz';
      }
    }).should.eql('baz');
  });

  it('cast() - default', function() {
    var type = new SchemaTypeString('test', {default: 'foo'});
    type.cast().should.eql('foo');
  });

  function shouldThrowError(value) {
    type.validate(value).should.be
      .instanceOf(ValidationError)
      .property('message', '`' + value + '` is not a string!');
  }

  it('validate()', function() {
    type.validate('foo').should.eql('foo');
    type.validate('').should.eql('');
    shouldThrowError(1);
    shouldThrowError(0);
    shouldThrowError(true);
    shouldThrowError(false);
    shouldThrowError([]);
    shouldThrowError({});
  });

  it('validate() - required', function() {
    var type = new SchemaTypeString('test', {required: true});
    type.validate().should.be
      .instanceOf(ValidationError)
      .property('message', '`test` is required!');
  });

  it('match()', function() {
    type.match('foo', 'foo').should.be.true;
    type.match('foo', 'bar').should.be.false;
  });

  it('match() - RegExp', function() {
    type.match('foo', /^f/).should.be.true;
    type.match('bar', /^f/).should.be.false;
    type.match(undefined, /^f/).should.be.false;
  });

  it('q$in()', function() {
    type.q$in('foo', ['foo', 'bar', 'baz']).should.be.true;
    type.q$in('wat', ['foo', 'bar', 'baz']).should.be.false;
    type.q$in(undefined, ['foo', 'bar', 'baz']).should.be.false;
    type.q$in('foo', [/^f/, /^g/]).should.be.true;
    type.q$in('bar', [/^f/, /^g/]).should.be.false;
  });

  it('q$nin()', function() {
    type.q$nin('foo', ['foo', 'bar', 'baz']).should.be.false;
    type.q$nin('wat', ['foo', 'bar', 'baz']).should.be.true;
    type.q$nin(undefined, ['foo', 'bar', 'baz']).should.be.true;
    type.q$nin('foo', [/^f/, /^g/]).should.be.false;
    type.q$nin('bar', [/^f/, /^g/]).should.be.true;
  });

  it('q$length()', function() {
    type.q$length('foo', 3).should.be.true;
    type.q$length('foo', 5).should.be.false;
    type.q$length(undefined, 3).should.be.false;
    type.q$length(undefined, 0).should.be.true;
  });
});
