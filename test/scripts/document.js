'use strict';

var should = require('chai').should(); // eslint-disable-line
var _ = require('lodash');

describe('Document', function() {
  var Database = require('../..');
  var Document = require('../../lib/document');
  var db = new Database();
  var Schema = Database.Schema;

  var User = db.model('User', {
    name: String,
    age: Number,
    comments: [{type: Schema.Types.CUID, ref: 'Comment'}]
  });

  var Comment = db.model('Comment', {
    content: String,
    author: {type: Schema.Types.CUID, ref: 'User'}
  });

  it('constructor', function() {
    var doc = User.new({
      name: 'John',
      age: 20
    });

    doc.should.be.an.instanceOf(Document);
    doc.name.should.eql('John');
    doc.age.should.eql(20);
  });

  it('constructor - no arguments', function() {
    var doc = User.new();

    doc.should.be.an.instanceOf(Document);
  });

  it('save() - insert', function() {
    var doc = User.new({});

    return doc.save().then(function(item) {
      User.findById(doc._id).should.exist;
      return User.removeById(item._id);
    });
  });

  it('save() - replace', function() {
    return User.insert({}).then(function(doc) {
      doc.name = 'A';
      return doc.save();
    }).then(function(doc) {
      doc.name.should.eql('A');
      return User.removeById(doc._id);
    });
  });

  it('update()', function() {
    return User.insert({}).then(function(doc) {
      return doc.update({name: 'A'});
    }).then(function(doc) {
      doc.name.should.eql('A');
      return User.removeById(doc._id);
    });
  });

  it('replace()', function() {
    return User.insert({}).then(function(doc) {
      return doc.replace({name: 'A'});
    }).then(function(doc) {
      doc.name.should.eql('A');
      return User.removeById(doc._id);
    });
  });

  it('remove()', function() {
    return User.insert({}).then(function(doc) {
      return doc.remove();
    }).then(function(doc) {
      should.not.exist(User.findById(doc._id));
    });
  });

  it('toObject()', function() {
    var doc = User.new({});
    doc.toObject().should.not.be.instanceOf(User.Document);
  });

  it('toObject() - don\'t deep clone getters', function() {
    var db = new Database();
    var User;

    var userSchema = new Schema({
      name: String,
      age: Number
    });

    userSchema.virtual('users').get(function() {
      return User.find({});
    });

    User = db.model('User', userSchema);

    return User.insert({}).then(function(data) {
      return User.findById(data._id);
    }).then(function(data) {
      data.toObject().should.be.ok;
    });
  });

  it('toString()', function() {
    var doc = User.new({});
    doc.toString().should.eql(JSON.stringify(doc));
  });

  it('populate() - object', function() {
    return User.insert({}).then(function(user) {
      var comment = Comment.new({
        author: user._id
      });

      comment.populate('author').author.should.eql(user);
      return user;
    }).then(function(user) {
      return User.removeById(user._id);
    });
  });

  it('populate() - array', function() {
    return Comment.insert([
      {content: 'foo'},
      {content: 'bar'},
      {content: 'baz'},
      {content: 'ha'}
    ]).then(function(comments) {
      var user = User.new({
        comments: _.map(comments, '_id')
      });

      user.populate('comments').comments.toArray().should.eql(comments);
      return comments;
    }).map(function(comment) {
      return Comment.removeById(comment._id);
    });
  });
});
