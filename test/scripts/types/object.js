var should = require('chai').should();

describe('SchemaTypeObject', function(){
  var SchemaTypeObject = require('../../../lib/types/object'),
    type = new SchemaTypeObject('test');

  it('cast() - default', function(){
    type.cast().should.eql({});
  });
});