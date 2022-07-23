import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import * as util from '../../dist/util';

describe('util', () => {
  it('shuffle()', () => {
    const src = Array(100).fill(0).map((_, i) => i);
    const result = util.shuffle(src);

    result.should.not.eql(src);
    result.should.to.have.members(src);
    result.should.to.have.length(src.length);

    src.should.eql(Array(100).fill(0).map((_, i) => i));
  });

  it('shuffle() - array must be an array', () => {
    (() => util.shuffle({})).should.to.throw('array must be an Array!');
  });

  it('getProp()', () => {
    const obj = {
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

  it('getProp() - obj must be an object', () => {
    (() => util.getProp("", "")).should.to.throw('obj must be an object!');
  });

  it('getProp() - key is required', () => {
    (() => util.getProp({}, null)).should.to.throw('key is required!');
  });

  it('setProp()', () => {
    const obj = {
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

  it('setProp() - obj must be an object', () => {
    (() => util.setProp("", "", "")).should.to.throw('obj must be an object!');
  });

  it('setProp() - key is required', () => {
    (() => util.setProp({}, null, null)).should.to.throw('key is required!');
  });

  it('delProp()', () => {
    const obj = {
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

  it('delProp() - obj must be an object', () => {
    (() => util.delProp("", null)).should.to.throw('obj must be an object!');
  });

  it('delProp() - key is required', () => {
    (() => util.delProp({}, null)).should.to.throw('key is required!');
  });

  it('setGetter()', () => {
    const obj = {
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

    util.setGetter(obj, 'a.b', () => 100);

    obj.a.b.should.eql(100);

    util.setGetter(obj, 'c', () => 200);

    obj.c.should.eql(200);

    util.setGetter(obj, 'd.e.f', () => 'haha');

    obj.d.e.f.should.eql('haha');

    util.setGetter(obj, 'a.c.h', () => 'ach');

    // @ts-ignore
    obj.a.c.h.should.eql('ach');
  });

  it('setGetter() - obj must be an object', () => {
    (() => util.setGetter("", null, null)).should.to.throw('obj must be an object!');
  });

  it('setGetter() - key is required', () => {
    (() => util.setGetter({}, null, null)).should.to.throw('key is required!');
  });

  it('setGetter() - fn must be a function', () => {
    (() => util.setGetter({}, 'test', {})).should.to.throw('fn must be a function!');
  });

  it('arr2obj()', () => {
    util.arr2obj(['a', 'b'], 1).should.eql({a: 1, b: 1});
  });

  it('arr2obj() - arr must be an array', () => {
    (() => util.arr2obj({}, null)).should.to.throw('arr must be an array!');
  });

  it('reverse()', () => {
    const arr = [1, '2', 'w'];

    util.reverse(arr).should.eql(['w', '2', 1]);
  });

  it('reverse() - arr must be an array', () => {
    (() => util.reverse({})).should.to.throw('arr must be an array!');
  });

  it('parseArgs()', () => {
    util.parseArgs('name').should.eql({name: 1});
    util.parseArgs('name', -1).should.eql({name: -1});
    util.parseArgs('name -date').should.eql({name: 1, date: -1});
    util.parseArgs('name -date +priority').should.eql({name: 1, date: -1, priority: 1});
  });
});
