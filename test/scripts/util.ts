import chai from 'chai';
const should = chai.should();
import { shuffle, getProp, setProp, delProp, setGetter, arr2obj, reverse, parseArgs } from '../../src/util';

describe('util', () => {
  it('shuffle()', () => {
    const src = Array(100).fill(0).map((_, i) => i);
    const result = shuffle(src);

    result.should.not.eql(src);
    result.should.to.have.members(src);
    result.should.to.have.length(src.length);

    src.should.eql(Array(100).fill(0).map((_, i) => i));
  });

  it('shuffle() - array must be an array', () => {
    // @ts-expect-error
    (() => shuffle({})).should.to.throw('array must be an Array!');
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

    getProp(obj, 'a.b').should.eql(obj.a.b);
    getProp(obj, 'c').should.eql(obj.c);
    getProp(obj, 'd.e.f').should.eql(obj.d.e.f);
  });

  it('getProp() - obj must be an object', () => {
    // @ts-expect-error
    (() => getProp('', null)).should.to.throw('obj must be an object!');
  });

  it('getProp() - key is required', () => {
    // @ts-ignore
    (() => getProp({}, null)).should.to.throw('key is required!');
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

    setProp(obj, 'a.b', 10);
    obj.a.b.should.eql(10);

    setProp(obj, 'c', 20);
    obj.c.should.eql(20);

    setProp(obj, 'd.e.f', 'haha');
    obj.d.e.f.should.eql('haha');
  });

  it('setProp() - obj must be an object', () => {
    // @ts-expect-error
    (() => setProp('', null, null)).should.to.throw('obj must be an object!');
  });

  it('setProp() - key is required', () => {
    // @ts-ignore
    (() => setProp({}, null, null)).should.to.throw('key is required!');
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

    delProp(obj, 'a.b');
    should.not.exist(obj.a.b);

    delProp(obj, 'c');
    should.not.exist(obj.c);

    delProp(obj, 'd.e.f');
    should.not.exist(obj.d.e.f);

    delProp(obj, 'd.f.g');
    should.exist(obj.d.e);
  });

  it('delProp() - obj must be an object', () => {
    // @ts-expect-error
    (() => delProp('', null)).should.to.throw('obj must be an object!');
  });

  it('delProp() - key is required', () => {
    // @ts-ignore
    (() => delProp({}, null)).should.to.throw('key is required!');
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

    setGetter(obj, 'a.b', () => 100);

    obj.a.b.should.eql(100);

    setGetter(obj, 'c', () => 200);

    obj.c.should.eql(200);

    setGetter(obj, 'd.e.f', () => 'haha');

    obj.d.e.f.should.eql('haha');

    setGetter(obj, 'a.c.h', () => 'ach');

    // @ts-ignore
    obj.a.c.h.should.eql('ach');
  });

  it('setGetter() - obj must be an object', () => {
    // @ts-expect-error
    (() => setGetter('', null, null)).should.to.throw('obj must be an object!');
  });

  it('setGetter() - key is required', () => {
    // @ts-ignore
    (() => setGetter({}, null, null)).should.to.throw('key is required!');
  });

  it('setGetter() - fn must be a function', () => {
    // @ts-expect-error
    (() => setGetter({}, 'test', {})).should.to.throw('fn must be a function!');
  });

  it('arr2obj()', () => {
    arr2obj(['a', 'b'], 1).should.eql({a: 1, b: 1});
  });

  it('arr2obj() - arr must be an array', () => {
    // @ts-expect-error
    (() => arr2obj({}, null)).should.to.throw('arr must be an array!');
  });

  it('reverse()', () => {
    const arr = [1, '2', 'w'];

    reverse(arr).should.eql(['w', '2', 1]);
  });

  it('reverse() - arr must be an array', () => {
    // @ts-expect-error
    (() => reverse({})).should.to.throw('arr must be an array!');
  });

  it('parseArgs()', () => {
    parseArgs('name').should.eql({name: 1});
    parseArgs('name', -1).should.eql({name: -1});
    parseArgs('name -date').should.eql({name: 1, date: -1});
    parseArgs('name -date +priority').should.eql({name: 1, date: -1, priority: 1});
    parseArgs({name: 1}).should.eql({name: 1});
  });
});
