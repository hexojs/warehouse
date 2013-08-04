var Database = require('../lib');

describe('Document', function(){
  var db = new Database();

  var Post = db.model('Post', {
    name: String,
    age: Number
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
    doc.save(function(item){
      id = item._id;

      var post = Post.get(id);

      post.name.should.be.eql('Test');
      post.age.should.be.eql(20);

      done();
    });
  });

  it('save() - update', function(){
    doc.age = 30;
    doc.save();

    var post = Post.get(id);
    post.age.should.be.eql(30);
  });

  it('toString()', function(){
    doc.toString().should.be.eql(JSON.stringify(doc));
  });

  it('remove()', function(){
    doc.remove();

    Post._checkID(id).should.be.false;
  });
});