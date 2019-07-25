# Warehouse

[![Build Status](https://travis-ci.org/hexojs/warehouse.svg?branch=master)](https://travis-ci.org/hexojs/warehouse)  [![NPM version](https://badge.fury.io/js/warehouse.svg)](http://badge.fury.io/js/warehouse) [![Coverage Status](https://coveralls.io/repos/github/hexojs/warehouse/badge.svg?branch=master)](https://coveralls.io/github/hexojs/warehouse?branch=master)

A JSON database with Models, Schemas, and a flexible querying interface. It powers the wildly successful static site generator [Hexo](https://hexo.io).

## Installation

``` bash
$ npm install warehouse
```

## Usage

``` js
var Database = require('warehouse');
var db = new Database();

var Post = db.model('posts', {
  title: String,
  created: {type: Date, default: Date.now}
});

Post.insert({
  title: 'Hello world'
}).then(function(post){
  console.log(post);
});
```

+ [API documentation](https://hexojs.github.io/warehouse/)
+ [Examples of `Model`, `Schema`, and `SchemaType`](https://github.com/hexojs/hexo/tree/master/lib/models)
+ [More examples in `./test/scripts`](./test/scripts)

## Test

``` bash
$ npm test
```
