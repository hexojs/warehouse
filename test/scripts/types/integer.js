var should = require('chai').should(),
  ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeInteger', function(){
  var SchemaTypeInteger = require('../../../lib/types/integer'),
    type = new SchemaTypeInteger('test');

  it('cast()', function(){
    type.cast(0).should.eql(0);
    type.cast(3.14).should.eql(3);
    type.cast('0').should.eql(0);
    type.cast('3.14').should.eql(3);
    type.cast('084').should.eql(84);
    type.cast(true).should.eql(1);
    type.cast(false).should.eql(0);
  });

  it('cast() - default', function(){
    var type = new SchemaTypeInteger('test', {default: 3});
    type.cast().should.eql(3);
  });

  function shouldThrowError(value){
    type.validate(value).should.be
      .instanceOf(ValidationError)
      .property('message', '`' + value + '` is not a number!');
  }

  it('validate()', function(){
    type.validate(1).should.eql(1);
    type.validate(0).should.eql(0);
    type.validate(3.14).should.be
      .instanceOf(ValidationError)
      .property('message', '`3.14` is not an integer!');
    shouldThrowError(NaN);
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError(false);
    shouldThrowError({});
  });

  it('validate() - required', function(){
    var type = new SchemaTypeInteger('test', {required: true});
    type.validate().should.be
      .instanceOf(ValidationError)
      .property('message', '`test` is required!');
  });
});