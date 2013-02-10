module.exports = require('./lib');

///console.log(new Date().toString());

//var _ = require('underscore');

//console.log(_.toArray(1));

var Store = require('./lib/store');

var store = new Store();
store.set('test', 123);
console.log(store.get('test'));