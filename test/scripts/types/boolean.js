'use strict';

require('chai').should();
const ValidationError = require('../../../built/error/validation');

describe('SchemaTypeBoolean', () => {
  const SchemaTypeBoolean = require('../../../built/types/boolean');
  const type = new SchemaTypeBoolean('test');

  it('cast()', () => {
    type.cast(true).should.be.true;
    type.cast(false).should.be.false;

    type.cast(0).should.be.false;
    type.cast('0').should.be.false;
    type.cast(1).should.be.true;
    type.cast('1').should.be.true;

    type.cast('').should.be.false;
    type.cast('false').should.be.false;
    type.cast('true').should.be.true;
    type.cast('foo').should.be.true;
  });

  it('cast() - default', () => {
    const type = new SchemaTypeBoolean('test', {default: true});
    type.cast().should.be.true;
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not a boolean!`);
  }

  it('validate()', () => {
    type.validate(true).should.be.true;
    type.validate(false).should.be.false;
    shouldThrowError(1);
    shouldThrowError(0);
    shouldThrowError('');
    shouldThrowError('foo');
    shouldThrowError([]);
    shouldThrowError({});
  });

  it('validate() - required', () => {
    const type = new SchemaTypeBoolean('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });

  it('parse()', () => {
    type.parse(1).should.be.true;
    type.parse(0).should.be.false;
  });

  it('value()', () => {
    type.value(true).should.eql(1);
    type.value(false).should.eql(0);
  });
});
