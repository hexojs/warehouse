'use strict';

var should = require('chai').should(); // eslint-disable-line

describe('util', function() {
  var util = require('../../lib/util');

  it('getProp()', function() {
    var obj = {
      a: {
        b: 1
      },
      c: 2,
      d: {
        e: {
          f: 'foo'
        }
      }
    };

    util.getProp(obj, 'a.b').should.eql(obj.a.b);
    util.getProp(obj, 'c').should.eql(obj.c);
    util.getProp(obj, 'd.e.f').should.eql(obj.d.e.f);
  });

  it('getProp() - obj must be an object', function() {
    try {
      util.getProp();
    } catch (err) {
      err.should.have.property('message', 'obj must be an object!');
    }
  });

  it('getProp() - key is required', function() {
    try {
      util.getProp({});
    } catch (err) {
      err.should.have.property('message', 'key is required!');
    }
  });

  it('setProp()', function() {
    var obj = {
      a: {
        b: 1
      },
      c: 2,
      d: {
        e: {
          f: 'foo'
        }
      }
    };

    util.setProp(obj, 'a.b', 10);
    obj.a.b.should.eql(10);

    util.setProp(obj, 'c', 20);
    obj.c.should.eql(20);

    util.setProp(obj, 'd.e.f', 'haha');
    obj.d.e.f.should.eql('haha');
  });

  it('setProp() - obj must be an object', function() {
    try {
      util.setProp();
    } catch (err) {
      err.should.have.property('message', 'obj must be an object!');
    }
  });

  it('setProp() - key is required', function() {
    try {
      util.setProp({});
    } catch (err) {
      err.should.have.property('message', 'key is required!');
    }
  });

  it('delProp()', function() {
    var obj = {
      a: {
        b: 1
      },
      c: 2,
      d: {
        e: {
          f: 'foo'
        }
      }
    };

    util.delProp(obj, 'a.b');
    should.not.exist(obj.a.b);

    util.delProp(obj, 'c');
    should.not.exist(obj.c);

    util.delProp(obj, 'd.e.f');
    should.not.exist(obj.d.e.f);
  });

  it('delProp() - obj must be an object', function() {
    try {
      util.delProp();
    } catch (err) {
      err.should.have.property('message', 'obj must be an object!');
    }
  });

  it('delProp() - key is required', function() {
    try {
      util.delProp({});
    } catch (err) {
      err.should.have.property('message', 'key is required!');
    }
  });

  it('setGetter()', function() {
    var obj = {
      a: {
        b: 1
      },
      c: 2,
      d: {
        e: {
          f: 'foo'
        }
      }
    };

    util.setGetter(obj, 'a.b', function() {
      return 100;
    });

    obj.a.b.should.eql(100);

    util.setGetter(obj, 'c', function() {
      return 200;
    });

    obj.c.should.eql(200);

    util.setGetter(obj, 'd.e.f', function() {
      return 'haha';
    });

    obj.d.e.f.should.eql('haha');

    util.setGetter(obj, 'a.c.h', function() {
      return 'ach';
    });

    obj.a.c.h.should.eql('ach');
  });

  it('setGetter() - obj must be an object', function() {
    try {
      util.setGetter();
    } catch (err) {
      err.should.have.property('message', 'obj must be an object!');
    }
  });

  it('setGetter() - key is required', function() {
    try {
      util.setGetter({});
    } catch (err) {
      err.should.have.property('message', 'key is required!');
    }
  });

  it('setGetter() - fn must be a function', function() {
    try {
      util.setGetter({}, 'test');
    } catch (err) {
      err.should.have.property('message', 'fn must be a function!');
    }
  });

  it('arr2obj()', function() {
    util.arr2obj(['a', 'b'], 1).should.eql({a: 1, b: 1});
  });

  it('arr2obj() - arr must be an array', function() {
    try {
      util.arr2obj();
    } catch (err) {
      err.should.have.property('message', 'arr must be an array!');
    }
  });

  it('arrayEqual()', function() {
    util.arrayEqual(['a', 'b'], ['a', 'b']).should.be.true;
    util.arrayEqual(['1', 2], ['1', '2']).should.be.false;
  });

  it('arrayEqual() - a must be an array', function() {
    try {
      util.arrayEqual();
    } catch (err) {
      err.should.have.property('message', 'a must be an array!');
    }
  });

  it('arrayEqual() - b must be an array', function() {
    try {
      util.arrayEqual([]);
    } catch (err) {
      err.should.have.property('message', 'b must be an array!');
    }
  });

  it('cloneArray()', function() {
    util.cloneArray([1, 2, 3]).should.eql([1, 2, 3]);
    util.cloneArray([1, [2, 3], [4, [5, 6]]]).should.eql([1, [2, 3], [4, [5, 6]]]);
  });

  it('cloneArray() - arr must be an array', function() {
    try {
      util.cloneArray();
    } catch (err) {
      err.should.have.property('message', 'arr must be an array!');
    }
  });

  it('contains()', function() {
    util.contains(['1', '2', 3], '1').should.be.true;
    util.contains(['1', '2', 3], '3').should.be.false;
  });

  it('contains() - arr must be an array', function() {
    try {
      util.contains();
    } catch (err) {
      err.should.have.property('message', 'arr must be an array!');
    }
  });

  it('reverse()', function() {
    var arr = [1, '2', 'w'];

    util.reverse(arr).should.eql(['w', '2', 1]);
  });

  it('reverse() - arr must be an array', function() {
    try {
      util.reverse();
    } catch (err) {
      err.should.have.property('message', 'arr must be an array!');
    }
  });

  it('shuffle()', function() {
    var arr = util.shuffle([1, 2, 3]);
    arr.sort().should.eql([1, 2, 3]);
  });

  it('parseArgs() - arr must be an array', function() {
    try {
      util.parseArgs();
    } catch (err) {
      err.should.have.property('message', 'arr must be an array!');
    }
  });

  it('parseArgs()', function() {
    util.parseArgs('name').should.eql({name: 1});
    util.parseArgs('name', -1).should.eql({name: -1});
    util.parseArgs('name -date').should.eql({name: 1, date: -1});
    util.parseArgs('name -date +priority').should.eql({name: 1, date: -1, priority: 1});
  });

  it('extend()', function() {
    util.extend({a: 1}, {b: 2}).should.eql({a: 1, b: 2});
    util.extend({a: 1}, undefined, {b: 2}).should.eql({a: 1, b: 2});
  });
});
