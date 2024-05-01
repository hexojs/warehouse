import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import SchemaTypeVirtual from '../../../dist/types/virtual';

describe('SchemaTypeVirtual', () => {
  const type = new SchemaTypeVirtual<any>('test');

  it('get()', () => {
    const getter = () => 'foo';

    type.get(getter);
    (type.getter as () => any).should.eql(getter);
  });

  it('get() - type check', () => {
    // @ts-ignore
    (() => type.get(123)).should.to.throw(TypeError, 'Getter must be a function!');
  });

  it('set()', () => {
    const setter = function() {
      this.foo = 'foo';
    };

    type.set(setter);
    (type.setter as () => any).should.eql(setter);
  });

  it('set() - type check', () => {
    // @ts-ignore
    (() => type.set(123)).should.to.throw(TypeError, 'Setter must be a function!');
  });

  it('cast()', () => {
    const obj = {name: 'foo'};

    type.get(function() {
      return this.name.toUpperCase();
    });

    type.cast(undefined, obj);
    // @ts-ignore
    obj.test.should.eql('FOO');
  });

  it('validate()', () => {
    const obj = {};

    type.set(function(value) {
      this.name = value.toLowerCase();
    });

    type.validate('FOO', obj);
    // @ts-ignore
    obj.name.should.eql('foo');
  });
});
