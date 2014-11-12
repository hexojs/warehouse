var should = require('chai').should();

describe('SchemaTypeVirtual', function(){
  var SchemaTypeVirtual = require('../../../lib/types/virtual');
  var type = new SchemaTypeVirtual('test');

  it('get()', function(){
    var getter = function(){
      return 'foo';
    };

    type.get(getter);
    type.getter.should.eql(getter);
  });

  it('get() - type check', function(){
    try {
      type.get(123);
    } catch (err){
      err.should.be
        .instanceOf(TypeError)
        .property('message', 'Getter must be a function!');
    }
  });

  it('set()', function(){
    var setter = function(){
      this.foo = 'foo';
    };

    type.set(setter);
    type.setter.should.eql(setter);
  });

  it('set() - type check', function(){
    try {
      type.set(123);
    } catch (err){
      err.should.be
        .instanceOf(TypeError)
        .property('message', 'Setter must be a function!');
    }
  });

  it('cast()', function(){
    var obj = {name: 'foo'};

    type.get(function(){
      return this.name.toUpperCase();
    });

    type.cast(undefined, obj);
    obj.test.should.eql('FOO');
  });

  it('validate()', function(){
    var obj = {};

    type.set(function(value){
      this.name = value.toLowerCase();
    });

    type.validate('FOO', obj);
    obj.name.should.eql('foo');
  });
});