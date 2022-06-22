// @ts-nocheck 
import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import ValidationError from '../../../dist/error/validation';
import SchemaTypeBuffer from '../../../dist/types/buffer';

describe('SchemaTypeBuffer', () => {
  const type = new SchemaTypeBuffer('test');

  it('cast()', () => {
    const buf = Buffer.from([97, 98, 99]);

    type.cast(buf).should.eql(buf);
    type.cast(buf.toString('hex')).should.eql(buf);
    type.cast([97, 98, 99]).should.eql(buf);
  });

  it('cast() - custom encoding', () => {
    const buf = Buffer.from([97, 98, 99]);
    const type = new SchemaTypeBuffer('test', {encoding: 'base64'});

    type.cast(buf.toString('base64')).should.eql(buf);
  });

  it('cast() - default', () => {
    const buf = Buffer.from([97, 98, 99]);
    const type = new SchemaTypeBuffer('test', {default: buf});

    type.cast().should.eql(buf);
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not a valid buffer!`);
  }

  it('validate()', () => {
    type.validate(Buffer.from([97, 98, 99])).should.eql(Buffer.from([97, 98, 99]));
    shouldThrowError(1);
    shouldThrowError('foo');
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError({});
  });

  it('validate() - required', () => {
    const type = new SchemaTypeBuffer('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });

  it('match()', () => {
    type.match(Buffer.from([97, 98, 99]), Buffer.from([97, 98, 99])).should.be.true;
    type.match(Buffer.from([97, 98, 99]), Buffer.from([97, 98, 100])).should.be.false;
    type.match(undefined, Buffer.from([97, 98, 99])).should.be.false;
    type.match(undefined, undefined).should.be.true;
  });

  it('compare()', () => {
    type.compare(Buffer.from([97, 98, 99]), Buffer.from([97, 98, 99])).should.eql(0);
    type.compare(Buffer.from([97, 98, 99]), Buffer.from([97, 98, 100])).should.lt(0);
    type.compare(Buffer.from([97, 98, 99]), Buffer.from([97, 98, 98])).should.gt(0);
    type.compare(Buffer.from([97, 98, 99])).should.eql(1);
    type.compare(undefined, Buffer.from([97, 98, 99])).should.eql(-1);
    type.compare().should.eql(0);
  });

  it('parse()', () => {
    const buf = Buffer.from([97, 98, 99]);
    type.parse(buf.toString('hex')).should.eql(buf);
    should.not.exist(type.parse());
  });

  it('parse() - custom encoding', () => {
    const type = new SchemaTypeBuffer('name', {encoding: 'base64'});
    const buf = Buffer.from([97, 98, 99]);
    type.parse(buf.toString('base64')).should.eql(buf);
  });

  it('value()', () => {
    const buf = Buffer.from([97, 98, 99]);
    type.value(buf).should.eql(buf.toString('hex'));
    should.not.exist(type.value());
  });

  it('value() - custom encoding', () => {
    const type = new SchemaTypeBuffer('name', {encoding: 'base64'});
    const buf = Buffer.from([97, 98, 99]);
    type.value(buf).should.eql(buf.toString('base64'));
  });
});
