var should = require('chai').should();

describe('Document', function(){
  var Database = require('../..'),
    Document = require('../../lib/document'),
    db = new Database();

  var User = db.model('User', {
    name: String,
    age: Number
  });

  it('constructor', function(){
    var doc = User.new({
      name: 'John',
      age: 20
    });

    doc.should.be.an.instanceOf(Document);
    doc.name.should.eql('John');
    doc.age.should.eql(20);
  });

  it('constructor - no arguments', function(){
    var doc = User.new();

    doc.should.be.an.instanceOf(Document);
  });

  it('save() - insert', function(){
    var doc = User.new({});

    return doc.save().then(function(item){
      User.findById(doc._id).should.exist;
      return User.removeById(item._id);
    });
  });

  it('save() - replace', function(){
    return User.insert({}).then(function(doc){
      doc.name = 'A';
      return doc.save();
    }).then(function(doc){
      doc.name.should.eql('A');
      return User.removeById(doc._id);
    });
  });

  it('update()', function(){
    return User.insert({}).then(function(doc){
      return doc.update({name: 'A'});
    }).then(function(doc){
      doc.name.should.eql('A');
      return User.removeById(doc._id);
    });
  });

  it('replace()', function(){
    return User.insert({}).then(function(doc){
      return doc.replace({name: 'A'});
    }).then(function(doc){
      doc.name.should.eql('A');
      return User.removeById(doc._id);
    });
  });

  it('remove()', function(){
    return User.insert({}).then(function(doc){
      return doc.remove();
    }).then(function(doc){
      should.not.exist(User.findById(doc._id));
    });
  });

  it('toObject()', function(){
    var doc = User.new({});
    doc.toObject().should.not.be.instanceOf(User.Document);
  });

  it('toString()', function(){
    var doc = User.new({});
    doc.toString().should.eql(JSON.stringify(doc));
  });

  it.skip('populate()');
});