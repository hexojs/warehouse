'use strict';

var should = require('chai').should(); // eslint-disable-line
var ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeNumber', function() {
  var SchemaTypeNumber = require('../../../lib/types/number');
  var type = new SchemaTypeNumber('type');

  it('cast()', function() {
    type.cast(0).should.eql(0);
    type.cast(1).should.eql(1);
    type.cast('0').should.eql(0);
    type.cast('1').should.eql(1);
    type.cast(true).should.eql(1);
    type.cast(false).should.eql(0);
  });

  it('cast() - default', function() {
    var type = new SchemaTypeNumber('type', {default: 42});
    type.cast().should.eql(42);
  });

  function shouldThrowError(value) {
    try {
      type.validate(value);
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`' + value + '` is not a number!');
    }
  }

  it('validate()', function() {
    type.validate(1).should.eql(1);
    type.validate(0).should.eql(0);
    shouldThrowError(NaN);
    shouldThrowError('');
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError(false);
    shouldThrowError({});
  });

  it('validate() - required', function() {
    var type = new SchemaTypeNumber('test', {required: true});

    try {
      type.validate();
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`test` is required!');
    }
  });

  it('u$inc()', function() {
    type.u$inc(2, 3).should.eql(5);
    type.u$inc(undefined, 3).should.eql(3);
  });

  it('u$dec()', function() {
    type.u$dec(2, 3).should.eql(-1);
    type.u$dec(undefined, 3).should.eql(-3);
  });

  it('u$mul()', function() {
    type.u$mul(2, 3).should.eql(6);
    type.u$mul(undefined, 3).should.eql(0);
  });

  it('u$div()', function() {
    type.u$div(10, 5).should.eql(2);
    type.u$div(undefined, 5).should.eql(0);
  });

  it('u$mod()', function() {
    type.u$mod(13, 5).should.eql(3);
    type.u$mod(undefined, 5).should.eql(0);
  });

  it('u$max()', function() {
    type.u$max(20, 50).should.eql(50);
    type.u$max(70, 50).should.eql(70);
  });

  it('u$min()', function() {
    type.u$min(30, 20).should.eql(20);
    type.u$min(10, 20).should.eql(10);
  });
});
