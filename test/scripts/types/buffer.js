'use strict';

var should = require('chai').should(); // eslint-disable-line
var ValidationError = require('../../../lib/error/validation');

describe('SchemaTypeBuffer', function() {
  var SchemaTypeBuffer = require('../../../lib/types/buffer');
  var type = new SchemaTypeBuffer('test');

  it('cast()', function() {
    var buf = new Buffer([97, 98, 99]);

    type.cast(buf).should.eql(buf);
    type.cast(buf.toString('hex')).should.eql(buf);
    type.cast([97, 98, 99]).should.eql(buf);
  });

  it('cast() - custom encoding', function() {
    var buf = new Buffer([97, 98, 99]);
    var type = new SchemaTypeBuffer('test', {encoding: 'base64'});

    type.cast(buf.toString('base64')).should.eql(buf);
  });

  it('cast() - default', function() {
    var buf = new Buffer([97, 98, 99]);
    var type = new SchemaTypeBuffer('test', {default: buf});

    type.cast().should.eql(buf);
  });

  function shouldThrowError(value) {
    try {
      type.validate(value);
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`' + value + '` is not a valid buffer!');
    }
  }

  it('validate()', function() {
    type.validate(new Buffer([97, 98, 99])).should.eql(new Buffer([97, 98, 99]));
    shouldThrowError(1);
    shouldThrowError('foo');
    shouldThrowError([]);
    shouldThrowError(true);
    shouldThrowError({});
  });

  it('validate() - required', function() {
    var type = new SchemaTypeBuffer('test', {required: true});

    try {
      type.validate();
    } catch (err) {
      err.should.be
        .instanceOf(ValidationError)
        .property('message', '`test` is required!');
    }
  });

  it('match()', function() {
    type.match(new Buffer([97, 98, 99]), new Buffer([97, 98, 99])).should.be.true;
    type.match(new Buffer([97, 98, 99]), new Buffer([97, 98, 100])).should.be.false;
    type.match(undefined, new Buffer([97, 98, 99])).should.be.false;
    type.match(undefined, undefined).should.be.true;
  });

  it('compare()', function() {
    type.compare(new Buffer([97, 98, 99]), new Buffer([97, 98, 99])).should.eql(0);
    type.compare(new Buffer([97, 98, 99]), new Buffer([97, 98, 100])).should.lt(0);
    type.compare(new Buffer([97, 98, 99]), new Buffer([97, 98, 98])).should.gt(0);
    type.compare(new Buffer([97, 98, 99])).should.eql(1);
    type.compare(undefined, new Buffer([97, 98, 99])).should.eql(-1);
    type.compare().should.eql(0);
  });

  it('parse()', function() {
    var buf = new Buffer([97, 98, 99]);
    type.parse(buf.toString('hex')).should.eql(buf);
    should.not.exist(type.parse());
  });

  it('parse() - custom encoding', function() {
    var type = new SchemaTypeBuffer('name', {encoding: 'base64'});
    var buf = new Buffer([97, 98, 99]);
    type.parse(buf.toString('base64')).should.eql(buf);
  });

  it('value()', function() {
    var buf = new Buffer([97, 98, 99]);
    type.value(buf).should.eql(buf.toString('hex'));
    should.not.exist(type.value());
  });

  it('value() - custom encoding', function() {
    var type = new SchemaTypeBuffer('name', {encoding: 'base64'});
    var buf = new Buffer([97, 98, 99]);
    type.value(buf).should.eql(buf.toString('base64'));
  });
});
