var should = require('should'),
  Virtual = require('../lib/virtual');

describe('Virtual', function(){
  it('constructor (without arguments)', function(){
    var virtual = new Virtual();

    should.not.exist(virtual.getter);
  });

  it('constructor (with arguments)', function(){
    var virtual = new Virtual(function(){
      return 1;
    });

    virtual.getter().should.be.eql(1);
  });

  it('get()', function(){
    var person = {
      first: 'John',
      last: 'Doe'
    };

    var virtual = new Virtual();

    virtual.get(function(){
      return this.first + ' ' + this.last;
    });

    virtual.getter.call(person).should.be.eql('John Doe');
  });

  it('set()', function(){
    var person = {};

    var virtual = new Virtual();

    virtual.set(function(name){
      var split = name.split(' ');

      this.first = split[0];
      this.last = split[1];
    });

    virtual.setter.call(person, 'John Doe');

    person.first.should.be.eql('John');
    person.last.should.be.eql('Doe');
  });
});