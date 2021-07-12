'use strict';

const should = require('chai').should(); // eslint-disable-line
const ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeArray', () => {
  const SchemaTypeArray = require('../../../lib/types/array');
  const SchemaTypeString = require('../../../lib/types/string');
  const SchemaTypeDate = require('../../../lib/types/date');
  const SchemaTypeBoolean = require('../../../lib/types/boolean');
  const type = new SchemaTypeArray('test');

  it('cast()', () => {
    type.cast('foo').should.eql(['foo']);
    type.cast([]).should.eql([]);
    type.cast([1, 2, 3]).should.eql([1, 2, 3]);
    type.cast().should.eql([]);
  });

  it('cast() - default', () => {
    const type = new SchemaTypeArray('test', {default: [1, 2, 3]});
    type.cast().should.eql([1, 2, 3]);
  });

  it('cast() - child', () => {
    const type = new SchemaTypeArray('test', {child: new SchemaTypeString()});
    type.cast([1, 2, 3]).should.eql(['1', '2', '3']);
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not an array!`);
  }

  it('validate()', () => {
    type.validate([]).should.eql([]);
    type.validate([1, 2, 3]).should.eql([1, 2, 3]);
    shouldThrowError('');
    shouldThrowError('foo');
    shouldThrowError(0);
    shouldThrowError(1);
    shouldThrowError({});
    shouldThrowError(true);
  });

  it('validate() - required', () => {
    const type = new SchemaTypeArray('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });

  it('validate() - child', () => {
    const type = new SchemaTypeArray('test', {child: new SchemaTypeString()});

    (() => type.validate([1, 2, 3])).should.to.throw(ValidationError, '`1` is not a string!');
  });

  it('compare()', () => {
    type.compare([1, 2, 3], [1, 2, 4]).should.eql(-1);
    type.compare([1, 2, 3], [1, 2, 3]).should.eql(0);
    type.compare([1, 2, 3], [1, 2, 2]).should.eql(1);
    type.compare([1, 2, 3, 4], [1, 2, 3]).should.eql(1);
    type.compare(undefined, []).should.eql(-1);
    type.compare([]).should.eql(1);
    type.compare().should.eql(0);
  });

  it('compare() - child', () => {
    const type = new SchemaTypeArray('test', {child: new SchemaTypeDate()});
    type.compare([new Date(1e8), new Date(1e8 + 1)], [new Date(1e8), new Date(1e8 + 2)])
      .should.eql(-1);
  });

  it('parse()', () => {
    type.parse([1, 2, 3]).should.eql([1, 2, 3]);
    should.not.exist(type.parse());
  });

  it('parse() - child', () => {
    const type = new SchemaTypeArray('test', {child: new SchemaTypeBoolean()});
    type.parse([0, 1, 0]).should.eql([false, true, false]);
  });

  it('value()', () => {
    type.value([1, 2, 3]).should.eql([1, 2, 3]);
    should.not.exist(type.value());
  });

  it('value() - child', () => {
    const type = new SchemaTypeArray('test', {child: new SchemaTypeBoolean()});
    type.value([true, false, true]).should.eql([1, 0, 1]);
  });

  it('match()', () => {
    type.match([1, 2, 3], [1, 2, 3]).should.be.true;
    type.match([1, 2, 3], ['1', '2', '3']).should.be.false;
    type.match([1, 2, 3], [1, 2, 3, 4]).should.be.false;
    type.match(undefined, []).should.be.false;
    type.match(undefined, undefined).should.be.true;
  });

  it('match() - child', () => {
    const type = new SchemaTypeArray('test', {child: new SchemaTypeDate()});
    type.match([new Date(2014, 1, 1)], [new Date(2014, 1, 1)]).should.be.true;
    type.match([new Date(2014, 1, 2)], [new Date(2014, 1, 1)]).should.be.false;
  });

  it('q$size()', () => {
    type.q$size([1, 2, 3], 3).should.be.true;
    type.q$size([1, 2], 3).should.be.false;
    type.q$size([], 0).should.be.true;
    type.q$size(undefined, 0).should.be.true;
    type.q$size(undefined, 3).should.be.false;
  });

  it('q$in()', () => {
    type.q$in([1, 2, 3], [1, 4]).should.be.true;
    type.q$in([1, 2, 3], [4, 5]).should.be.false;
    type.q$in(undefined, [1, 2]).should.be.false;
  });

  it('q$nin()', () => {
    type.q$nin([1, 2, 3], [1, 4]).should.be.false;
    type.q$nin([1, 2, 3], [4, 5]).should.be.true;
    type.q$nin(undefined, [1, 2]).should.be.true;
  });

  it('q$all()', () => {
    type.q$all([1, 2, 3], [1, 2]).should.be.true;
    type.q$all([1, 2, 3], [1, 4]).should.be.false;
    type.q$all([1, 2, 3], [4, 5, 6]).should.be.false;
    type.q$all(undefined, [1, 2]).should.be.false;
  });

  it('u$push()', () => {
    type.u$push([1, 2, 3], 4).should.eql([1, 2, 3, 4]);
    type.u$push([1, 2, 3], [4, 5]).should.eql([1, 2, 3, 4, 5]);
    type.u$push(undefined, 4).should.eql([4]);
    type.u$push(undefined, [4, 5]).should.eql([4, 5]);
  });

  it('u$unshift()', () => {
    type.u$unshift([1, 2, 3], 0).should.eql([0, 1, 2, 3]);
    type.u$unshift([1, 2, 3], [-1, 0]).should.eql([-1, 0, 1, 2, 3]);
    type.u$unshift(undefined, 0).should.eql([0]);
    type.u$unshift(undefined, [0, 1]).should.eql([0, 1]);
  });

  it('u$pull()', () => {
    type.u$pull([1, 2, 3, 3, 4], 3).should.eql([1, 2, 4]);
    type.u$pull([1, 1, 2, 3, 3], [1, 3]).should.eql([2]);
    should.not.exist(type.u$pull(undefined, 1));
  });

  it('u$shift()', () => {
    type.u$shift([1, 2, 3], true).should.eql([2, 3]);
    type.u$shift([1, 2, 3], 2).should.eql([3]);
    type.u$shift([1, 2, 3], false).should.eql([1, 2, 3]);
    type.u$shift([1, 2, 3], 0).should.eql([1, 2, 3]);
    type.u$shift([1, 2, 3], -1).should.eql([1, 2]);
    should.not.exist(type.u$shift(undefined, true));
  });

  it('u$pop()', () => {
    type.u$pop([1, 2, 3], true).should.eql([1, 2]);
    type.u$pop([1, 2, 3], 2).should.eql([1]);
    type.u$pop([1, 2, 3], false).should.eql([1, 2, 3]);
    type.u$pop([1, 2, 3], 0).should.eql([1, 2, 3]);
    type.u$pop([1, 2, 3], -1).should.eql([2, 3]);
    should.not.exist(type.u$pop(undefined, true));
  });

  it('u$addToSet()', () => {
    type.u$addToSet([1, 2, 3], 4).should.eql([1, 2, 3, 4]);
    type.u$addToSet([1, 2, 3], 2).should.eql([1, 2, 3]);
    type.u$addToSet([1, 2, 3], [4, 5]).should.eql([1, 2, 3, 4, 5]);
    type.u$addToSet([1, 2, 3], [2, 4, 6]).should.eql([1, 2, 3, 4, 6]);
    type.u$addToSet(undefined, 1).should.eql([1]);
    type.u$addToSet(undefined, [1, 2, 3]).should.eql([1, 2, 3]);
  });
});
