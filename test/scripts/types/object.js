'use strict';

var should = require('chai').should(); // eslint-disable-line

describe('SchemaTypeObject', function() {
  var SchemaTypeObject = require('../../../lib/types/object');
  var type = new SchemaTypeObject('test');

  it('cast() - default', function() {
    type.cast().should.eql({});
  });
});
