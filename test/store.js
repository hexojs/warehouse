var should = require('should'),
  Store = require('../lib/store');

describe('Store', function(){
  var store = new Store();

  it('constructor', function(){
    var store = new Store({
      foo: 1,
      bar: 2
    });

    store.get('foo').should.eql(1);
    store.get('bar').should.eql(2);
  });

  it('set() - insert', function(){
    store.set('foo', 1);
    store.get('foo').should.eql(1);
  });

  it('set() - update', function(){
    store.set('foo', 2);
    store.get('foo').should.eql(2);
  });

  it('get()', function(){
    store.get('foo').should.eql(2);
  });

  it('list()', function(){
    store.list().should.eql({
      foo: 2
    });
  });
});