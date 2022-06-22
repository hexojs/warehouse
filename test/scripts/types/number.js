'use strict';

require('chai').should();
const ValidationError = require('../../../dist/error/validation');

describe('SchemaTypeNumber', () => {
  const SchemaTypeNumber = require('../../../dist/types/number');
  const type = new SchemaTypeNumber('type');

  it('cast()', () => {
    type.cast(0).should.eql(0);
    type.cast(1).should.eql(1);
    type.cast('0').should.eql(0);
    type.cast('1').should.eql(1);
    type.cast(true).should.eql(1);
    type.cast(false).should.eql(0);
  });

  it('cast() - default', () => {
    const type = new SchemaTypeNumber('type', {default: 42});
    type.cast().should.eql(42);
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not a number!`);
  }

  it('validate()', () => {
    type.validate(1).should.eql(1);
    type.validate(0).should.eql(0);
    shouldThrowError(NaN);
    shouldThrowError('');
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError(false);
    shouldThrowError({});
  });

  it('validate() - required', () => {
    const type = new SchemaTypeNumber('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });

  it('u$inc()', () => {
    type.u$inc(2, 3).should.eql(5);
    type.u$inc(undefined, 3).should.eql(3);
  });

  it('u$dec()', () => {
    type.u$dec(2, 3).should.eql(-1);
    type.u$dec(undefined, 3).should.eql(-3);
  });

  it('u$mul()', () => {
    type.u$mul(2, 3).should.eql(6);
    type.u$mul(undefined, 3).should.eql(0);
  });

  it('u$div()', () => {
    type.u$div(10, 5).should.eql(2);
    type.u$div(undefined, 5).should.eql(0);
  });

  it('u$mod()', () => {
    type.u$mod(13, 5).should.eql(3);
    type.u$mod(undefined, 5).should.eql(0);
  });

  it('u$max()', () => {
    type.u$max(20, 50).should.eql(50);
    type.u$max(70, 50).should.eql(70);
  });

  it('u$min()', () => {
    type.u$min(30, 20).should.eql(20);
    type.u$min(10, 20).should.eql(10);
  });
});
