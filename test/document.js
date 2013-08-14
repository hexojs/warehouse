var Database = require('../lib'),
  should = require('should'),
  util = require('../lib/util'),
  uid = util.uid;

describe('Document', function(){
  var db = new Database();

  var User = db.model('User', {
    name: String
  });

  User.insert({
    name: 'Foo'
  });

  var Comment = db.model('Comment', {
    content: String
  });

  var dummyComment = [];

  for (var i = 0; i < 10; i++){
    dummyComment.push({
      content: uid(24)
    });
  }

  Comment.insert(dummyComment);

  var Post = db.model('Post', {
    name: String,
    age: Number,
    user_id: {type: String, ref: 'User'},
    comments: [{type: String, ref: 'Comment'}]
  });

  var doc = Post.new({
    name: 'Test',
    age: 20
  });

  var id;

  it('create a new document', function(){
    doc.should.be.instanceof(Post._doc);
    doc.name.should.be.eql('Test');
    doc.age.should.be.eql(20);
  });

  it('save() - insert', function(done){
    doc.save(function(post){
      id = post._id;

      post.should.be.instanceof(Post._doc);
      post.name.should.be.eql('Test');
      post.age.should.be.eql(20);

      done();
    });
  });

  it('save() - update', function(done){
    doc.age = 30;

    doc.save(function(post){
      post.should.be.instanceof(Post._doc);
      post.age.should.be.eql(30);

      done();
    });
  });

  it('update()', function(done){
    doc.update({name: 'New'}, function(post){
      post.should.be.instanceof(Post._doc);
      post.name.should.be.eql('New');

      done();
    });
  });

  it('replace()', function(done){
    doc.replace({name: 'Foo'}, function(post){
      post.should.be.instanceof(Post._doc);
      post.name.should.be.eql('Foo');
      should.not.exist(post.age);

      done();
    });
  });

  it('populate() - object', function(){
    var user = User.first();
    doc.user_id = user._id;

    doc.populate('user_id');
    doc.user_id.should.be.eql(user);
  });

  it('populate() - array', function(){
    doc.comments = Comment._index;

    doc.populate('comments');
    doc.comments._index.should.be.eql(Comment._index);
    doc.comments.toArray().should.be.eql(Comment.toArray());
  });

  it('toString()', function(){
    doc.toString().should.be.eql(JSON.stringify(doc));
  });

  it('remove()', function(){
    doc.remove();

    Post._checkID(id).should.be.false;
  });
});