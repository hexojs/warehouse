import chai from 'chai';
const should = chai.should();
import { nanoid } from 'nanoid';
import ValidationError from '../../../src/error/validation';
import SchemaTypeCUID from '../../../src/types/cuid';

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
    const id = 'cuid' + nanoid();
    type.validate(id).should.eql(id);

    (() => type.validate('foo')).should.to.throw(ValidationError, '`foo` is not a valid CUID');
  });
});
