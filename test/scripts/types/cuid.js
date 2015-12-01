'use strict';

var should = require('chai').should(); // eslint-disable-line
var ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeCUID', function() {
  var SchemaTypeCUID = require('../../../lib/types/cuid');
  var type = new SchemaTypeCUID('test');

  it('cast()', function() {
    type.cast('foo').should.eql('foo');
    should.not.exist(type.cast());
  });

  it('cast() - required', function() {
    var type = new SchemaTypeCUID('test', {required: true});
    type.cast().should.exist;
  });

  it('validate()', function() {
    type.validate('ch72gsb320000udocl363eofy').should.eql('ch72gsb320000udocl363eofy');

    try {
      type.validate('foo');
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`foo` is not a valid CUID');
    }
  });
});
