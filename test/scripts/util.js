var should = require('chai').should();

describe('util', function(){
  var util = require('../../lib/util');

  it('getProp', function(){
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

  it('setProp', function(){
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

  it('delProp', function(){
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

  it('arr2obj', function(){
    util.arr2obj(['a', 'b'], 1).should.eql({a: 1, b: 1});
  });

  it('arrayEqual', function(){
    util.arrayEqual(['a', 'b'], ['a', 'b']).should.be.true;
    util.arrayEqual(['1', 2], ['1', '2']).should.be.false;
  });

  it.skip('deepCloneNoPrototype', function(){
    //
  });

  it('contains', function(){
    util.contains(['1', '2', 3], '1').should.be.true;
    util.contains(['1', '2', 3], '3').should.be.false;
  });

  it('reverse', function(){
    var arr = [1, '2', 'w'];

    util.reverse(arr).should.eql(['w', '2', 1]);
  });

  it.skip('shuffle', function(){
    //
  });

  it('parseSortArgs', function(){
    util.parseArgs('name').should.eql({name: 1});
    util.parseArgs('name', -1).should.eql({name: -1});
    util.parseArgs('name -date').should.eql({name: 1, date: -1});
  });

  it.skip('callbackWrapper', function(){
    //
  });
});