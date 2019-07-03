'use strict';

require('chai').should();
const ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeBoolean', () => {
  const SchemaTypeBoolean = require('../../../lib/types/boolean');
  const type = new SchemaTypeBoolean('test');

  it('cast()', () => {
    type.cast(true).should.eql(true);
    type.cast(false).should.eql(false);

    type.cast(0).should.eql(false);
    type.cast('0').should.eql(false);
    type.cast(1).should.eql(true);
    type.cast('1').should.eql(true);

    type.cast('').should.eql(false);
    type.cast('false').should.eql(false);
    type.cast('true').should.eql(true);
    type.cast('foo').should.eql(true);
  });

  it('cast() - default', () => {
    const type = new SchemaTypeBoolean('test', {default: true});
    type.cast().should.eql(true);
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not a boolean!`);
  }

  it('validate()', () => {
    type.validate(true).should.eql(true);
    type.validate(false).should.eql(false);
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
    type.parse(1).should.eql(true);
    type.parse(0).should.eql(false);
  });

  it('value()', () => {
    type.value(true).should.eql(1);
    type.value(false).should.eql(0);
  });
});
