import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import { nanoid } from 'nanoid';
import ValidationError from '../../../dist/error/validation';
import SchemaTypeCUID from '../../../dist/types/cuid';

describe('SchemaTypeCUID', () => {
  const type = new SchemaTypeCUID('test');

  it('cast()', () => {
    type.cast('foo').should.eql('foo');
    should.not.exist(type.cast());
  });

  it('cast() - required', () => {
    const type = new SchemaTypeCUID('test', {required: true});
    type.cast().should.exist;
  });

  it('validate()', () => {
    const id = nanoid();
    type.validate(id).should.eql(id);

    (() => type.validate('foo')).should.to.throw(ValidationError, '`foo` is not a valid CUID');
  });
});
