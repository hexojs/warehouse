'use strict';

var should = require('chai').should(); // eslint-disable-line
var ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeEnum', function() {
  var SchemaTypeEnum = require('../../../lib/types/enum');

  it('validate()', function() {
    var type = new SchemaTypeEnum('test', {elements: ['foo', 'bar', 'baz']});

    type.validate('foo').should.eql('foo');

    try {
      type.validate('wat');
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', 'The value must be one of foo, bar, baz');
    }
  });

  it('validate() - required', function() {
    var type = new SchemaTypeEnum('test', {required: true});

    try {
      type.validate();
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`test` is required!');
    }
  });
});
