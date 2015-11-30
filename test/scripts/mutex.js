'use strict';

var should = require('chai').should(); // eslint-disable-line
var Mutex = require('../../lib/mutex');
var sinon = require('sinon');

describe('Mutex', function() {
  it('mutex test', function(callback) {
    var mutex = new Mutex();
    var fn1, fn2;

    fn1 = sinon.spy(function() {
      setTimeout(function() {
        fn2.called.should.be.false;
        mutex.unlock();
      }, 20);
    });

    fn2 = sinon.spy(function() {
      fn1.calledOnce.should.be.true;
      mutex.unlock();
    });

    mutex.lock(fn1);
    mutex.lock(fn2);

    mutex.lock(function() {
      fn1.calledOnce.should.be.true;
      fn2.calledOnce.should.be.true;
      callback();
    });
  });
});
