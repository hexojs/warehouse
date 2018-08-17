'use strict';

const should = require('chai').should(); // eslint-disable-line

describe('SchemaTypeObject', () => {
  const SchemaTypeObject = require('../../../lib/types/object');
  const type = new SchemaTypeObject('test');

  it('cast() - default', () => {
    type.cast().should.eql({});
  });
});
