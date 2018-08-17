'use strict';

const should = require('chai').should(); // eslint-disable-line

describe('SchemaTypeVirtual', () => {
  const SchemaTypeVirtual = require('../../../lib/types/virtual');
  const type = new SchemaTypeVirtual('test');

  it('get()', () => {
    const getter = () => 'foo';

    type.get(getter);
    type.getter.should.eql(getter);
  });

  it('get() - type check', () => {
    try {
      type.get(123);
    } catch (err) {
      err.should.be
        .instanceOf(TypeError)
        .property('message', 'Getter must be a function!');
    }
  });

  it('set()', () => {
    const setter = function() {
      this.foo = 'foo';
    };

    type.set(setter);
    type.setter.should.eql(setter);
  });

  it('set() - type check', () => {
    try {
      type.set(123);
    } catch (err) {
      err.should.be
        .instanceOf(TypeError)
        .property('message', 'Setter must be a function!');
    }
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
