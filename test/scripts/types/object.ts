import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import SchemaTypeObject from '../../../dist/types/object';

describe('SchemaTypeObject', () => {
  const type = new SchemaTypeObject('test');

  it('cast() - default', () => {
    type.cast().should.eql({});
  });
});
