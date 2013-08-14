var Database = require('../lib'),
  Schema = require('../lib/schema'),
  should = require('should');

describe('Model', function(){
  var db = new Database();

  var userSchema = new Schema({
    name: {
      first: String,
      last: String
    },
    email: String,
    age: Number,
    posts: [{type: String, ref: 'Post'}]
  });

  userSchema.virtual('name.full').get(function(){
    return this.name.first + ' ' + this.name.last;
  }).set(function(name){
    var split = name.split(' ');

    this.name = {
      first: split[0],
      last: split[1]
    };
  });

  userSchema.method('addPost', function(data, callback){
    var self = this;

    data.user_id = this._id;

    Post.insert(data, function(post){
      self.update({
        posts: {$push: post._id}
      });

      callback && callback(post);
    });
  });

  var postSchema = new Schema({
    title: String,
    content: String,
    user_id: {type: String, ref: 'User'},
    created: Date
  });

  postSchema.static('findLatest', function(){
    return this.sort({created: -1}).first();
  });

  var User = db.model('User', userSchema),
    Post = db.model('Post', postSchema);

  it('apply schema methods', function(){
    Post.findLatest.should.be.a('function');
    User._doc.prototype.addPost.should.be.a('function');
  });

  it('insert() - object', function(done){
    User.insert({
      name: {
        first: 'John',
        last: 'Doe'
      },
      email: 'a@abc.com',
      age: 20
    }, function(user){
      user.should.be.instanceof(User._doc);
      user.name.first.should.be.eql('John');
      user.name.last.should.be.eql('Doe');
      user.name.full.should.be.eql('John Doe');
      user.email.should.be.eql('a@abc.com');
      user.age.should.be.eql(20);
      user._id.should.have.length(16);

      done();
    });
  });

  it('insert() - array', function(done){
    var user_id = User.first()._id;

    Post.insert([
      {
        title: 'Post One',
        content: 'post one content',
        user_id: user_id,
        date: new Date(2013, 0, 1)
      },
      {
        title: 'Post Two',
        content: 'post two content',
        user_id: user_id,
        date: new Date(2012, 0, 1)
      },
      {
        title: 'Post Three',
        content: 'post three content',
        user_id: user_id,
        date: new Date(2014, 0, 1)
      },
    ], function(posts){
      posts[0].should.be.instanceof(Post._doc);
      posts[0].title.should.be.eql('Post One');
      posts[0].content.should.be.eql('post one content');
      posts[0].user_id.should.be.eql(user_id);
      posts[0].date.should.be.eql(new Date(2013, 0, 1));
      posts[0]._id.should.have.length(16);

      posts[1].should.be.instanceof(Post._doc);
      posts[1].title.should.be.eql('Post Two');
      posts[1].content.should.be.eql('post two content');
      posts[1].user_id.should.be.eql(user_id);
      posts[1].date.should.be.eql(new Date(2012, 0, 1));
      posts[1]._id.should.have.length(16);

      posts[2].should.be.instanceof(Post._doc);
      posts[2].title.should.be.eql('Post Three');
      posts[2].content.should.be.eql('post three content');
      posts[2].user_id.should.be.eql(user_id);
      posts[2].date.should.be.eql(new Date(2014, 0, 1));
      posts[2]._id.should.have.length(16);

      done();
    });
  });

  it('_checkID()', function(){
    var post = Post.first();

    Post._checkID(post._id).should.be.true;
    Post._checkID('test').should.be.false;
  });

  it('get()', function(){
    var id = User._index[0],
      user = User.get(id);

    user.should.be.instanceof(User._doc);
    user.name.first.should.be.eql('John');
    user.name.last.should.be.eql('Doe');
    user.name.full.should.be.eql('John Doe');
    user.email.should.be.eql('a@abc.com');
    user.age.should.be.eql(20);
    user._id.should.be.eql(id);
  });

  it('_getRaw()', function(){
    var id = User._index[0],
      user = User._getRaw(id);

    user.should.not.be.instanceof(User._doc);
    user.name.first.should.be.eql('John');
    user.name.last.should.be.eql('Doe');
    should.not.exist(user.name.full);
    user.email.should.be.eql('a@abc.com');
    user.age.should.be.eql(20);
    user._id.should.be.eql(id);
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
    var user = User.new({
      name: {
        first: 'Silver',
        last: 'Crow'
      },
      age: 17,
      email: 'b@abc.com'
    });

    user.should.be.instanceof(User._doc);
    user.name.first.should.be.eql('Silver');
    user.name.last.should.be.eql('Crow');
    user.age.should.be.eql(17);
    user.email.should.be.eql('b@abc.com');
  });

  it('schema static test', function(){
    var post = Post.findLatest();

    post.should.be.eql(Post.eq(2));
  });

  it('schema method test', function(done){
    var user = User.first();

    user.addPost({
      title: 'Post Four',
      content: 'post four content',
      created: new Date(2011, 0, 1)
    }, function(post){
      var user = User.first();

      post.should.be.instanceof(Post._doc);
      post.title.should.be.eql('Post Four');
      post.content.should.be.eql('post four content');
      post.created.should.be.eql(new Date(2011, 0, 1));
      post._id.should.have.length(16);
      post.user_id.should.be.eql(user._id);

      user.posts.should.include(post._id);

      done();
    });
  });

  it('updateById()', function(done){
    var id = User._index[0];

    User.updateById(id, {age: 21}, function(user){
      user.should.be.instanceof(User._doc);
      user.name.first.should.be.eql('John');
      user.name.last.should.be.eql('Doe');
      user.name.full.should.be.eql('John Doe');
      user.email.should.be.eql('a@abc.com');
      user.age.should.be.eql(21);
      user._id.should.be.eql(id);

      done();
    });
  });

  it('updateById - operators', function(done){
    var id = User._index[0],
      age = User.first().age;

    User.updateById(id, {age: {$inc: 1}}, function(user){
      user.age.should.be.eql(age + 1);
      done();
    });
  });

  it('replaceById()', function(done){
    var id = Post._index[1];

    var data = {
      title: 'New Post',
      content: 'new post content'
    };

    Post.replaceById(id, data, function(post){
      post.should.be.instanceof(Post._doc);
      post.title.should.be.eql('New Post');
      post.content.should.be.eql('new post content');
      should.not.exist(post.created);
      post._id.should.be.eql(id);

      done();
    });
  });

  it('save() - insert', function(done){
    var index = Post._index.slice();

    var data = {
      title: 'Post five',
      content: 'post five content'
    };

    Post.save(data, function(post){
      post.should.be.instanceof(Post._doc);
      post.title.should.be.eql('Post five');
      post.content.should.be.eql('post five content');
      post._id.should.have.length(16);
      index.should.not.include(post._id);

      done();
    });
  });

  it('save() - replace', function(done){
    var index = Post._index.slice(),
      last = Post.last();

    var data = {
      title: 'New post five',
      _id: last._id
    };

    Post.save(data, function(post){
      post.should.be.instanceof(Post._doc);
      post.title.should.be.eql('New post five');
      should.not.exist(post.content);
      post._id.should.be.eql(last._id);
      index.should.be.eql(Post._index);

      done();
    });
  });

  it('removeById()', function(done){
    var post = Post.last();

    Post.removeById(post._id, function(item){
      item.should.be.eql(post);
      Post._checkID(post._id).should.be.false;

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

  it('populate()', function(){
    var query = Post.populate('user_id');

    query.should.be.instanceof(Post._query);
    query._populates.should.include('user_id');
  });

  it('_populate() - object', function(){
    var user = User.first();

    var post = Post._populate({
      title: 'Post seven',
      content: 'post seven content',
      user_id: user._id
    }, ['user_id']);

    post.title.should.be.eql('Post seven');
    post.content.should.be.eql('post seven content');
    post.user_id.should.be.eql(user);
  });

  it('_populate() - array', function(){
    var data = User.first();

    data.posts = Post._index.slice();

    var user = User._populate(data, ['posts']);

    user.name.first.should.be.eql('John');
    user.name.last.should.be.eql('Doe');
    user.name.full.should.be.eql('John Doe');
    user.email.should.be.eql('a@abc.com');
    user.age.should.be.eql(22);
    user._id.should.be.eql(data._id);
    user.posts._index.should.be.eql(Post._index);
    user.posts.toArray().should.be.eql(Post.toArray());
  });
});