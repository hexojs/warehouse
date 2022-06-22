'use strict';

require('chai').should();
const ValidationError = require('../../../built/error/validation');

describe('SchemaTypeEnum', () => {
  const SchemaTypeEnum = require('../../../built/types/enum');

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
