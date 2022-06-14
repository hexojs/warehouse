import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import ValidationError from '../../../lib/error/validation.js';
import SchemaTypeEnum from '../../../lib/types/enum.js';

describe('SchemaTypeEnum', () => {
  it('validate()', () => {
    const type = new SchemaTypeEnum('test', {elements: ['foo', 'bar', 'baz']});

    type.validate('foo').should.eql('foo');

    (() => type.validate('wat')).should.to.throw(ValidationError, 'The value must be one of foo, bar, baz');
  });

  it('validate() - required', () => {
    const type = new SchemaTypeEnum('test', {required: true});

    type.validate.bind(type).should.to.throw(ValidationError, '`test` is required!');
  });
});
