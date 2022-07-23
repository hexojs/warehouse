import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import SchemaTypeVirtual from '../../../lib/types/virtual.js';

describe('SchemaTypeVirtual', () => {
  const type = new SchemaTypeVirtual('test');

  it('get()', () => {
    const getter = () => 'foo';

    type.get(getter);
    type.getter.should.eql(getter);
  });

  it('get() - type check', () => {
    (() => type.get(123)).should.to.throw(TypeError, 'Getter must be a function!');
  });

  it('set()', () => {
    const setter = function() {
      this.foo = 'foo';
    };

    type.set(setter);
    type.setter.should.eql(setter);
  });

  it('set() - type check', () => {
    (() => type.set(123)).should.to.throw(TypeError, 'Setter must be a function!');
  });

  it('cast()', () => {
    const obj = {name: 'foo'};

    type.get(function() {
      return this.name.toUpperCase();
    });

    type.cast(undefined, obj);
    obj.test.should.eql('FOO');
  });

  it('validate()', () => {
    const obj = {};

    type.set(function(value) {
      this.name = value.toLowerCase();
    });

    type.validate('FOO', obj);
    obj.name.should.eql('foo');
  });
});
