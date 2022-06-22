import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import ValidationError from '../../../lib/error/validation';
import SchemaTypeInteger from '../../../lib/types/integer';

describe('SchemaTypeInteger', () => {
  const type = new SchemaTypeInteger('test');

  it('cast()', () => {
    type.cast(0).should.eql(0);
    type.cast(3.14).should.eql(3);
    type.cast('0').should.eql(0);
    type.cast('3.14').should.eql(3);
    type.cast('084').should.eql(84);
    type.cast(true).should.eql(1);
    type.cast(false).should.eql(0);
  });

  it('cast() - default', () => {
    const type = new SchemaTypeInteger('test', {default: 3});
    type.cast().should.eql(3);
  });

  function shouldThrowError(value) {
    (() => type.validate(value)).should.to.throw(ValidationError, `\`${value}\` is not a number!`);
  }

  it('validate()', () => {
    type.validate(1).should.eql(1);
    type.validate(0).should.eql(0);
    shouldThrowError(NaN);
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError(false);
    shouldThrowError({});

    (() => type.validate(3.14)).should.to.throw(ValidationError, '`3.14` is not an integer!');
  });

  it('validate() - required', () => {
    const type = new SchemaTypeInteger('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });
});
