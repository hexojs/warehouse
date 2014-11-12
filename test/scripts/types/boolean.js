var should = require('chai').should();
var ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeBoolean', function(){
  var SchemaTypeBoolean = require('../../../lib/types/boolean');
  var type = new SchemaTypeBoolean('test');

  it('cast()', function(){
    type.cast(true).should.eql(true);
    type.cast(false).should.eql(false);

    type.cast(0).should.eql(false);
    type.cast('0').should.eql(false);
    type.cast(1).should.eql(true);
    type.cast('1').should.eql(true);

    type.cast('').should.eql(false);
    type.cast('false').should.eql(false);
    type.cast('true').should.eql(true);
    type.cast('foo').should.eql(true);
  });

  it('cast() - default', function(){
    var type = new SchemaTypeBoolean('test', {default: true});
    type.cast().should.eql(true);
  });

  function shouldThrowError(value){
    type.validate(value).should.be
      .instanceOf(ValidationError)
      .property('message', '`' + value + '` is not a boolean!');
  }

  it('validate()', function(){
    type.validate(true).should.eql(true);
    type.validate(false).should.eql(false);
    shouldThrowError(1);
    shouldThrowError(0);
    shouldThrowError('');
    shouldThrowError('foo');
    shouldThrowError([]);
    shouldThrowError({});
  });

  it('validate() - required', function(){
    var type = new SchemaTypeBoolean('test', {required: true});
    type.validate().should.be
      .instanceOf(ValidationError)
      .property('message', '`test` is required!');
  });

  it('parse()', function(){
    type.parse(1).should.eql(true);
    type.parse(0).should.eql(false);
  });

  it('value()', function(){
    type.value(true).should.eql(1);
    type.value(false).should.eql(0);
  });
});