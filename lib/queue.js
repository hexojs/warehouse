'use strict';

var Promise = require('bluebird');

/**
 * Promise queue.
 *
 * @method Queue
 * @constructor
 * @module warehouse
 */
function Queue(){
  /**
   * The queue of tasks.
   *
   * @property {Array} tasks
   * @private
   */
  this.tasks = [];

  /**
   * The number of pending tasks.
   *
   * @property {Number} pendingTasks
   * @private
   */
  this.pendingTasks = 0;
}

/**
 * Push a new task to the queue.
 *
 * @method push
 * @param {Function} fn
 * @return {Promise}
 */
Queue.prototype.push = function(fn){
  var self = this;

  return new Promise(function(resolve, reject){
    self.tasks.push({
      fn: Promise.method(fn),
      resolve: resolve,
      reject: reject
    });

    self._dequeue();
  });
};

/**
 * Execute the next task in the queue.
 *
 * @method _dequeue
 * @private
 */
Queue.prototype._dequeue = function(){
  var tasks = this.tasks;

  if (this.pendingTasks || !tasks.length) return;

  var task = tasks.shift();
  var self = this;

  this.pendingTasks++;

  task.fn().then(function(data){
    task.resolve(data);
  }, function(err){
    task.reject(err);
  }).finally(function(){
    self.pendingTasks--;
    self._dequeue();
  });
};

module.exports = Queue;