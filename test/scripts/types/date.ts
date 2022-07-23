import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import ValidationError from '../../../dist/error/validation';
import SchemaTypeDate from '../../../dist/types/date';

describe('SchemaTypeDate', () => {
  const type = new SchemaTypeDate('test');

  it('cast()', () => {
    type.cast(new Date(2014, 1, 1)).should.eql(new Date(2014, 1, 1));
    type.cast(1e8).should.eql(new Date(1e8));
    type.cast('2014-11-03T07:45:41.237Z').should.eql(new Date('2014-11-03T07:45:41.237Z'));
  });

  it('cast() - default', () => {
    const date = new Date();
    const type = new SchemaTypeDate('test', {default: date});

    type.cast().should.eql(date);
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not a valid date!`);
  }

  it('validate()', () => {
    type.validate(new Date(2014, 1, 1)).should.eql(new Date(2014, 1, 1));
    shouldThrowError(1);
    shouldThrowError('foo');
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError({});
    shouldThrowError(new Date('foo'));
  });

  it('validate() - required', () => {
    const type = new SchemaTypeDate('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });

  it('match()', () => {
    type.match(new Date(2014, 1, 1), new Date(2014, 1, 1)).should.be.true;
    type.match(new Date(2014, 1, 1), new Date(2014, 1, 2)).should.be.false;
    type.match(undefined, new Date()).should.be.false;
    type.match(undefined, undefined).should.be.true;
  });

  it('compare()', () => {
    type.compare(new Date(2014, 1, 3), new Date(2014, 1, 2)).should.gt(0);
    type.compare(new Date(2014, 1, 1), new Date(2014, 1, 2)).should.lt(0);
    type.compare(new Date(2014, 1, 2), new Date(2014, 1, 2)).should.eql(0);
    type.compare(new Date()).should.eql(1);
    type.compare(undefined, new Date()).should.eql(-1);
    type.compare().should.eql(0);
  });

  it('parse()', () => {
    type.parse('2014-11-03T07:45:41.237Z').should.eql(new Date('2014-11-03T07:45:41.237Z'));
    should.not.exist(type.parse());
  });

  it('value()', () => {
    type.value(new Date('2014-11-03T07:45:41.237Z')).should.eql('2014-11-03T07:45:41.237Z');
    should.not.exist(type.value());
  });

  it('q$day()', () => {
    type.q$day(new Date(2014, 1, 1), 1).should.be.true;
    type.q$day(new Date(2014, 1, 1), 5).should.be.false;
    type.q$day(undefined, 1).should.be.false;
  });

  it('q$month()', () => {
    type.q$month(new Date(2014, 1, 1), 1).should.be.true;
    type.q$month(new Date(2014, 1, 1), 5).should.be.false;
    type.q$month(undefined, 1).should.be.false;
  });

  it('q$year()', () => {
    type.q$year(new Date(2014, 1, 1), 2014).should.be.true;
    type.q$year(new Date(2014, 1, 1), 1999).should.be.false;
    type.q$year(undefined, 2014).should.be.false;
  });

  it('u$inc()', () => {
    type.u$inc(new Date(1e8), 1).should.eql(new Date(1e8 + 1));
    should.not.exist(undefined, "1");
  });

  it('u$dec()', () => {
    type.u$dec(new Date(1e8), 1).should.eql(new Date(1e8 - 1));
    should.not.exist(undefined, "1");
  });
});
