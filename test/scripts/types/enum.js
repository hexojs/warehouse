'use strict';

const should = require('chai').should(); // eslint-disable-line
const ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeEnum', () => {
  const SchemaTypeEnum = require('../../../lib/types/enum');

  it('validate()', () => {
    const type = new SchemaTypeEnum('test', {elements: ['foo', 'bar', 'baz']});

    type.validate('foo').should.eql('foo');

    try {
      type.validate('wat');
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', 'The value must be one of foo, bar, baz');
    }
  });

  it('validate() - required', () => {
    const type = new SchemaTypeEnum('test', {required: true});

    try {
      type.validate();
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`test` is required!');
    }
  });
});
