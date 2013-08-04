var Database = require('../lib'),
  Model = require('../lib/model'),
  should = require('should'),
  fs = require('fs');

describe('Database', function(){
  var db = new Database();

  it('model() - with schema', function(){
    var Post = db.model('Post', {
      name: {
        first: String,
        last: String
      },
      age: Number
    });

    Post.should.be.instanceof(Model);
  });

  it('model() - without schema', function(){
    var Post = db.model('Post');

    Post.should.be.instanceof(Model);
  });

  it('save() - no target', function(done){
    db.save(function(err){
      err.message.should.be.eql('Destination is not defined');

      done();
    });
  });

  it('save() - target preset', function(done){
    var db = new Database(__dirname + '/test.json');

    db.save(function(err){
      should.not.exist(err);

      done();
    });
  });

  it('save() - target argument', function(done){
    var Post = db.model('Post');

    Post.insert(require('./dummy.json'));

    db.save(__dirname + '/test.json', function(err){
      should.not.exist(err);

      done();
    });
  });

  it('load() - no source', function(done){
    var db = new Database();

    db.load(function(err){
      err.message.should.be.eql('Source is not defined');

      done();
    });
  });

  it('load() - target preset', function(done){
    var db = new Database(__dirname + '/test.json');

    db.load(function(err){
      should.not.exist(err);

      var Post = db.model('Post');

      Post.each(function(item, i){
        item.should.be.eql(db._store.Post[i]);
      });

      done();
    });
  });

  it('load() - target argument', function(done){
    var db = new Database();

    db.load(__dirname + '/test.json', function(err){
      should.not.exist(err);

      var Post = db.model('Post');

      Post.each(function(item, i){
        item.should.be.eql(db._store.Post[i]);
      });

      done();
    });
  });

  after(function(){
    fs.unlink(__dirname + '/test.json');
  });
});