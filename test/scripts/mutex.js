'use strict';

const should = require('chai').should(); // eslint-disable-line
const Mutex = require('../../built/mutex');
const sinon = require('sinon');

describe('Mutex', () => {
  it('mutex test', callback => {
    const mutex = new Mutex();
    let fn2;

    const fn1 = sinon.spy(() => {
      setTimeout(() => {
        fn2.called.should.be.false;
        mutex.unlock();
      }, 20);
    });

    fn2 = sinon.spy(() => {
      fn1.calledOnce.should.be.true;
      mutex.unlock();
    });

    mutex.lock(fn1);
    mutex.lock(fn2);

    mutex.lock(() => {
      fn1.calledOnce.should.be.true;
      fn2.calledOnce.should.be.true;
      callback();
    });
  });
});
