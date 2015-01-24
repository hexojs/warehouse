var should = require('chai').should();
var Promise = require('bluebird');
var sinon = require('sinon');

function wait(ms){
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve();
    }, ms);
  });
}

describe('Queue', function(){
  var Queue = require('../../lib/queue');
  var queue = new Queue();

  it('push()', function(){
    var fn1 = sinon.spy(function(){
      return wait(30).then(function(){
        fn2.called.should.be.false;
        return 'foo';
      });
    });

    var fn2 = sinon.spy(function(){
      return 'bar';
    });

    return Promise.all([
      queue.push(fn1),
      queue.push(fn2)
    ]).then(function(result){
      queue.tasks.length.should.eql(0);
      queue.pendingTasks.should.eql(0);
      fn1.calledOnce.should.be.true;
      fn2.calledOnce.should.be.true;
      result.should.eql(['foo', 'bar']);
    });
  });

  it('push() - error handling', function(){
    var fn1 = sinon.spy(function(){
      throw new Error('WOW!');
    });

    var fn2 = sinon.spy(function(){
      return 'bar';
    });

    return Promise.all([
      queue.push(fn1).catch(function(err){
        err.should.have.property('message', 'WOW!');
      }),
      queue.push(fn2)
    ]).then(function(result){
      fn1.calledOnce.should.be.true;
      fn2.calledOnce.should.be.true;
      result.should.eql([undefined, 'bar']);
    });
  });
});