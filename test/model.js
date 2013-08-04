var Database = require('../lib'),
  Schema = require('../lib/schema'),
  should = require('should');

describe('Model', function(){
  var db = new Database();

  var schema = new Schema({
    name: {
      first: String,
      last: String
    },
    email: String,
    age: Number,
    comments: [String],
    created: Date
  });

  schema.static('findLatest', function(){
    return this.sort({created: -1}).limit(3);
  });

  schema.method('fullName', function(){
    return this.name.first + ' ' + this.name.last;
  });

  schema.virtual('name.full').get(function(){
    return this.name.first + ' ' + this.name.last;
  }).set(function(name){
    var split = name.split(' ');

    this.name = {
      first: split[0],
      last: split[1]
    };
  });

  var Post = db.model('Post', schema);

  it('apply schema methods', function(){
    Post.findLatest.should.be.a('function');
    Post._doc.prototype.fullName.should.be.a('function');
  });

  it('insert() - object', function(done){
    Post.insert({
      name: {
        first: 'John',
        last: 'Doe'
      },
      email: 'abc@abc.com',
      age: 30
    }, function(data){
      data.should.be.instanceof(Post._doc);
      data.name.first.should.be.eql('John');
      data.name.last.should.be.eql('Doe');
      data.name.full.should.be.eql('John Doe');
      data.email.should.be.eql('abc@abc.com');
      data.age.should.be.eql(30);
      data.fullName().should.be.eql('John Doe');
      data._id.should.have.length(16);

      done();
    });
  });

  it('insert() - array', function(done){
    var now = Date.now();

    Post.insert([
      {
        email: 'def@ghi.com',
        age: 50,
        created: now
      },
      {
        name: {
          full: 'Scarlet Rain'
        },
        comments: ['Great!']
      }
    ], function(arr){
      var dataA = arr[0],
        dataB = arr[1];

      dataA.should.be.instanceof(Post._doc);
      dataA.email.should.be.eql('def@ghi.com');
      dataA.age.should.be.eql(50);
      dataA.created.should.be.instanceof(Date);
      dataA.created.valueOf().should.be.eql(now);
      dataA._id.should.have.length(16);

      dataB.should.be.instanceof(Post._doc);
      dataB.name.first.should.be.eql('Scarlet');
      dataB.name.last.should.be.eql('Rain');
      dataB.name.full.should.be.eql('Scarlet Rain');
      dataB.fullName().should.be.eql('Scarlet Rain');
      dataB.comments.should.be.eql(['Great!']);
      dataB._id.should.have.length(16);

      done();
    });
  });

  it('_updateIndex()', function(){
    Post._updateIndex();

    var index = Post._index;

    Post.each(function(post, i){
      post._id.should.be.eql(index[i]);
    });
  });

  it('_checkID()', function(){
    var index = Post._index;

    index.forEach(function(item){
      Post._checkID(item).should.be.true;
    });
  });

  it('get()', function(){
    var id = Post._index[0],
      post = Post.get(id);

    post.should.be.instanceof(Post._doc);
    post.name.first.should.be.eql('John');
    post.name.last.should.be.eql('Doe');
    post.email.should.be.eql('abc@abc.com');
    post.age.should.be.eql(30);
    post.fullName().should.be.eql('John Doe');
    post._id.should.have.length(16);
  });

  it('_getRaw()', function(){
    var id = Post._index[0],
      raw = Post._getRaw(id);

    raw.should.not.be.instanceof(Post._doc);
    raw.name.first.should.be.eql('John');
    raw.name.last.should.be.eql('Doe');
    raw.email.should.be.eql('abc@abc.com');
    raw.age.should.be.eql(30);
    raw._id.should.have.length(16);
  });

  it('each()', function(){
    var count = 0;

    Post.each(function(item, i){
      item.should.be.instanceof(Post._doc);
      item.should.be.eql(Post.get(item._id));
      count.should.be.eql(i);
      count++;
    });
  });

  it('toArray()', function(){
    var arr = [];

    Post.each(function(item){
      arr.push(item);
    });

    Post.toArray().should.be.eql(arr);
  });

  it('count()', function(){
    Post.count().should.be.eql(Post._index.length);
  });

  it('length', function(){
    Post.length.should.be.eql(Post._index.length);
  });

  it('eq() - positive number', function(){
    for (var i = 0, len = Post.count(); i < len; i++){
      Post.eq(i).should.be.eql(Post.get(Post._index[i]));
    }
  });

  it('eq() - negative number', function(){
    for (var i = 1, len = Post.count(); i <= len; i++){
      Post.eq(-i).should.be.eql(Post.get(Post._index[len - i]));
    }
  });

  it('first()', function(){
    Post.first().should.be.eql(Post.eq(0));
  });

  it('last()', function(){
    Post.last().should.be.eql(Post.eq(-1));
  });

  it('new()', function(){
    var post = Post.new({
      name: {
        first: 'Silver',
        last: 'Crow'
      },
      age: 17
    });

    post.should.be.instanceof(Post._doc);
    post.name.first.should.be.eql('Silver');
    post.name.last.should.be.eql('Crow');
    post.age.should.be.eql(17);
    post.fullName().should.be.eql('Silver Crow');
  });

  it('updateById()', function(done){
    var id = Post._index[0];

    Post.updateById(id, {age: 40}, function(post){
      post.should.be.instanceof(Post._doc);
      post.name.first.should.be.eql('John');
      post.name.last.should.be.eql('Doe');
      post.email.should.be.eql('abc@abc.com');
      post.age.should.be.eql(40);
      post._id.should.be.eql(id);

      done();
    });
  });

  it('replaceById()', function(done){
    var id = Post._index[1];

    var data = {
      name: {
        first: 'Black',
        last: 'Lotus'
      },
      age: 18
    };

    Post.replaceById(id, data, function(post){
      post.should.be.instanceof(Post._doc);
      post.name.first.should.be.eql('Black');
      post.name.last.should.be.eql('Lotus');
      post.age.should.be.eql(18);
      post._id.should.be.eql(id);

      done();
    });
  });

  it('removeById()', function(done){
    var post = Post.last(),
      id = post._id;

    Post.removeById(id, function(item){
      item.should.be.eql(post);
      Post._checkID(id).should.be.false;

      done();
    });
  });

  it('save() - insert', function(done){
    var index = Post._index.slice();
    var data = {
      name: {
        first: 'Lime',
        last: 'Bell'
      },
      email: 'abc@abc.com'
    };

    Post.save(data, function(item){
      item.should.be.instanceof(Post._doc);
      item.name.first.should.be.eql('Lime');
      item.name.last.should.be.eql('Bell');
      item.email.should.be.eql('abc@abc.com');
      item._id.should.have.length(16);
      index.should.not.include(item._id);

      done();
    });
  });

  it('save() - replace', function(done){
    var last = Post.last(),
      id = last._id;

    var data = {
      name: {
        first: 'Cyan',
        last: 'Pile'
      },
      email: 'def@def.jp',
      _id: id
    };

    Post.save(data, function(item){
      item.should.be.instanceof(Post._doc);
      item.name.first.should.be.eql('Cyan');
      item.name.last.should.be.eql('Pile');
      item.email.should.be.eql('def@def.jp');
      item._id.should.be.eql(id);

      done();
    });
  });

  it('_createQuery() - no arguments', function(){
    var query = Post._createQuery();

    query.should.be.instanceof(Post._query);
    query._index.should.be.eql(Post._index);
  });

  it('_createQuery() - with arguments', function(){
    var query = Post._createQuery([]);

    query.should.be.instanceof(Post._query);
    query._index.should.be.eql([]);
  });

  it('slice()', function(){
    var query = Post.slice(0, 2);

    query.should.be.instanceof(Post._query);
    query._index.should.be.eql(Post._index.slice(0, 2));
  });

  it('limit()', function(){
    var query = Post.limit(2);

    query.should.be.instanceof(Post._query);
    query._index.should.be.eql(Post._index.slice(0, 2));
  });

  it('skip()', function(){
    var query = Post.skip(1);

    query.should.be.instanceof(Post._query);
    query._index.should.be.eql(Post._index.slice(1));
  });

  it('reverse()', function(){
    var query = Post.reverse();

    query.should.be.instanceof(Post._query);
    query._index.should.be.eql(Post._index.slice().reverse());
  });

  it('sort() - old style', function(){
    var query = Post.sort('age', 1);

    query.should.be.instanceof(Post._query);
  });

  it('sort() - new style', function(){
    var query = Post.sort({age: 1});

    query.should.be.instanceof(Post._query);
  });

  it('random()', function(){
    var query = Post.random();

    query.should.be.instanceof(Post._query);
  });

  it('find() - no options', function(){
    var query = Post.find({});

    query.should.be.instanceof(Post._query);
  });

  it('find() - with options', function(){
    var query = Post.find({}, {limit: 1});

    query.should.be.instanceof(Post._query);
    query.count().should.be.eql(1);
  });

  it('findOne()', function(){
    var item = Post.findOne({});

    item.should.be.instanceof(Post._doc);
    item.should.be.eql(Post.first());
  });
});