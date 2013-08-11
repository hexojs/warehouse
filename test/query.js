var Database = require('../lib');

describe('Query', function(){
  var db = new Database();

  var Post = db.model('Post', {
    name: {
      first: String,
      last: String
    },
    age: Number,
    comments: []
  });

  Post.insert(require('./dummy.json'));

  var query = Post._createQuery();

  it('create a query', function(){
    query.should.be.instanceof(Post._query);
  });

  it('_createQuery()', function(){
    var q = query._createQuery();

    q.should.be.instanceof(Post._query);
    q._index.should.be.eql(query._index);
  });

  it('each()', function(){
    query.each(function(item){
      item.should.be.instanceof(Post._doc);
      item.should.be.eql(Post.get(item._id));
    });
  });

  it('toArray()', function(){
    var arr = [];

    query.each(function(item){
      arr.push(item);
    });

    query.toArray().should.be.eql(arr);
  });

  it('count()', function(){
    query.count().should.be.eql(query._index.length);
  });

  it('length', function(){
    query.length.should.be.eql(query._index.length);
  });

  it('eq() - positive number', function(){
    for (var i = 0, len = query.count(); i < len; i++){
      query.eq(i).should.be.eql(Post.get(query._index[i]));
    }
  });

  it('eq() - negative number', function(){
    for (var i = 1, len = query.count(); i <= len; i++){
      query.eq(-i).should.be.eql(Post.get(query._index[len - i]));
    }
  });

  it('first()', function(){
    query.first().should.be.eql(query.eq(0));
  });

  it('last()', function(){
    query.last().should.be.eql(query.eq(-1));
  });

  it('slice()', function(){
    var q = query.slice(0, 2);

    q.should.be.instanceof(Post._query);
    q._index.should.be.eql(query._index.slice(0, 2));
  });

  it('limit()', function(){
    var q = query.limit(2);

    q.should.be.instanceof(Post._query);
    q._index.should.be.eql(query._index.slice(0, 2));
  });

  it('skip()', function(){
    var q = query.skip(1);

    q.should.be.instanceof(Post._query);
    q._index.should.be.eql(query._index.slice(1));
  });

  it('reverse()', function(){
    var q = query.reverse();

    q.should.be.instanceof(Post._query);
    q._index.should.be.eql(query._index.slice().reverse());
  });

  it('sort() - old style', function(){
    var q = query.sort('age', 1),
      last;

    q.should.be.instanceof(Post._query);

    q.each(function(item){
      if (last == null){
        last = item.age;
      } else {
        if (last > item.age){
          throw new Error('sort error');
        } else {
          last = item.age;
        }
      }
    });
  });

  it('sort() - new style', function(){
    var q = query.sort({age: 1}),
      last;

    q.should.be.instanceof(Post._query);

    q.each(function(item){
      if (last == null){
        last = item.age;
      } else {
        if (last > item.age){
          throw new Error('sort error');
        } else {
          last = item.age;
        }
      }
    });
  });

  it('random()', function(){
    var q = query.random();

    q.should.be.instanceof(Post._query);
    q._index.sort().should.be.eql(query._index.sort());
  });

  it('find() - normal', function(){
    var q = query.find({age: 100});

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      item.age.should.be.eql(100);
    });
  });

  it('find() - RegExp', function(){
    var regex = /^Mc/,
      q = query.find({'name.last': regex});

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      item.name.last.should.match(regex);
    })
  });

  it('find() - operators', function(){
    var q = query.find({age: {$gt: 50}});

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      (item.age > 50).should.be.true;
    });
  });

  it('find() - $or', function(){
    var q = query.find({$or: [
      {age: {$gt: 65}},
      {age: {$lt: 18}}
    ]});

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      (item.age > 65 || item.age < 18).should.be.true;
    });
  });

  it('find() - $and', function(){
    var q = query.find({$and: [
      {'name.last': /^Mc/},
      {age: {$lt: 50}}
    ]});

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      item.name.last.should.match(/^Mc/);
      (item.age < 50).should.be.true;
    });
  });

  it('find() - $not', function(){
    var q = query.find({
      $not: {'name.last': /^Mc/}
    });

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      item.name.last.should.not.match(/^Mc/);
    });
  });

  it('find() - $nor', function(){
    var q = query.find({$nor: [
      {'name.last': /^Mc/},
      {age: {$lt: 50}}
    ]});

    q.should.be.instanceof(Post._query);
    q.each(function(item){
      item.name.last.should.not.match(/^Mc/);
      (item.age < 50).should.not.be.true;
    });
  });

  it('findOne()', function(){
    var item = query.findOne({});

    item.should.be.instanceof(Post._doc);
    item.should.be.eql(query.first());
  });

  it('update()', function(){
    query.update({age: 0});

    query.each(function(item){
      item.age.should.be.eql(0);
    });
  });

  it('update() - operators', function(){
    query.update({age: {$inc: 10}});

    query.each(function(item){
      item.age.should.be.eql(10);
    });
  });

  it('replace()', function(){
    query.replace({age: 20});

    query.each(function(item){
      item.age.should.be.eql(20)
    });
  });

  it('remove()', function(){
    query.remove();

    Post.length.should.be.eql(0);
  });
});