# Warehouse

[![Build Status](https://travis-ci.org/tommy351/warehouse.svg?branch=master)](https://travis-ci.org/tommy351/warehouse)  [![NPM version](https://badge.fury.io/js/warehouse.svg)](http://badge.fury.io/js/warehouse) [![Coverage Status](https://img.shields.io/coveralls/tommy351/warehouse.svg?branch=master)](https://coveralls.io/r/tommy351/warehouse)

## Installation

``` bash
$ npm install warehouse 
```

## Usage

``` js
var Database = require('warehouse'),
  db = new Database();
  
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

- [API](http://hexo.io/api/warehouse/classes/Database.html)

## Test

``` bash
$ gulp test
```