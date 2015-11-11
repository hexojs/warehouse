'use strict';

var should = require('chai').should(); // eslint-disable-line
var ValidationError = require('../../lib/error/validation');

describe('SchemaType', function() {
  var SchemaType = require('../../lib/schematype');
  var type = new SchemaType('test');

  it('cast()', function() {
    type.cast(123).should.eql(123);
  });

  it('cast() - default', function() {
    var type = new SchemaType('test', {default: 'foo'});
    type.cast().should.eql('foo');
  });

  it('validate()', function() {
    type.validate(123).should.eql(123);
  });

  it('validate() - required', function() {
    var type = new SchemaType('test', {required: true});
    type.validate().should.be
      .instanceOf(ValidationError)
      .property('message', '`test` is required!');
  });

  it('compare()', function() {
    type.compare(2, 1).should.eql(1);
    type.compare(1, 2).should.eql(-1);
    type.compare(1, 1).should.eql(0);
  });

  it('parse()', function() {
    type.parse(123).should.eql(123);
  });

  it('value()', function() {
    type.value(123).should.eql(123);
  });

  it('match()', function() {
    type.match(1, 1).should.be.true;
    type.match(1, '1').should.be.false;
  });

  it('q$exist', function() {
    // array
    type.q$exist(['foo'], true).should.be.true;
    type.q$exist([], true).should.be.true;
    type.q$exist(['foo'], false).should.be.false;
    type.q$exist([], false).should.be.false;

    // boolean
    type.q$exist(true, true).should.be.true;
    type.q$exist(false, true).should.be.true;
    type.q$exist(true, false).should.be.false;
    type.q$exist(false, false).should.be.false;

    // number
    type.q$exist(1, true).should.be.true;
    type.q$exist(0, true).should.be.true;
    type.q$exist(1, false).should.be.false;
    type.q$exist(0, false).should.be.false;

    // object
    type.q$exist({length: 1}, true).should.be.true;
    type.q$exist({}, true).should.be.true;
    type.q$exist({length: 1}, false).should.be.false;
    type.q$exist({}, false).should.be.false;

    // string
    type.q$exist('test', true).should.be.true;
    type.q$exist('', true).should.be.true;
    type.q$exist('test', false).should.be.false;
    type.q$exist('', false).should.be.false;

    // undefined
    type.q$exist(null, true).should.be.false;
    type.q$exist(undefined, true).should.be.false;
    type.q$exist(null, false).should.be.true;
    type.q$exist(undefined, false).should.be.true;
  });

  it('q$ne', function() {
    type.q$ne(1, 1).should.be.false;
    type.q$ne(1, '1').should.be.true;
  });

  it('q$lt', function() {
    type.q$lt(1, 2).should.be.true;
    type.q$lt(1, 1).should.be.false;
    type.q$lt(1, 0).should.be.false;
  });

  it('q$lte', function() {
    type.q$lte(1, 2).should.be.true;
    type.q$lte(1, 1).should.be.true;
    type.q$lte(1, 0).should.be.false;
  });

  it('q$gt', function() {
    type.q$gt(1, 2).should.be.false;
    type.q$gt(1, 1).should.be.false;
    type.q$gt(1, 0).should.be.true;
  });

  it('q$gte', function() {
    type.q$gte(1, 2).should.be.false;
    type.q$gte(1, 1).should.be.true;
    type.q$gte(1, 0).should.be.true;
  });

  it('q$in', function() {
    type.q$in(1, [0, 1, 2]).should.be.true;
    type.q$in(1, ['0', '1', '2']).should.be.false;
  });

  it('q$nin', function() {
    type.q$nin(1, [0, 2, 4]).should.be.true;
    type.q$nin(1, [0, 1, 2]).should.be.false;
  });

  it('u$set', function() {
    type.u$set(1, 1).should.eql(1);
  });

  it('u$unset', function() {
    should.not.exist(type.u$unset(1, true));
    type.u$unset(1, false).should.eql(1);
  });

  it('u$rename', function() {
    var obj = {a: 1};
    should.not.exist(type.u$rename(1, 'b', obj));
    obj.b.should.eql(1);
  });
});
