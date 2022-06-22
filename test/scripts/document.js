'use strict';

const should = require('chai').should(); // eslint-disable-line

describe('Document', () => {
  const Database = require('../..');
  const Document = require('../../built/document');
  const db = new Database();
  const Schema = Database.Schema;

  const User = db.model('User', {
    name: String,
    age: Number,
    comments: [{type: Schema.Types.CUID, ref: 'Comment'}]
  });

  const Comment = db.model('Comment', {
    content: String,
    author: {type: Schema.Types.CUID, ref: 'User'}
  });

  it('constructor', () => {
    const doc = User.new({
      name: 'John',
      age: 20
    });

    doc.should.be.an.instanceOf(Document);
    doc.name.should.eql('John');
    doc.age.should.eql(20);
  });

  it('constructor - no arguments', () => {
    const doc = User.new();

    doc.should.be.an.instanceOf(Document);
  });

  it('save() - insert', () => {
    const doc = User.new({});

    return doc.save().then(item => {
      User.findById(doc._id).should.exist;
      return User.removeById(item._id);
    });
  });

  it('save() - replace', () => User.insert({}).then(doc => {
    doc.name = 'A';
    return doc.save();
  }).then(doc => {
    doc.name.should.eql('A');
    return User.removeById(doc._id);
  }));

  it('update()', () => User.insert({}).then(doc => doc.update({name: 'A'})).then(doc => {
    doc.name.should.eql('A');
    return User.removeById(doc._id);
  }));

  it('replace()', () => User.insert({}).then(doc => doc.replace({name: 'A'})).then(doc => {
    doc.name.should.eql('A');
    return User.removeById(doc._id);
  }));

  it('remove()', () => User.insert({}).then(doc => doc.remove()).then(doc => {
    should.not.exist(User.findById(doc._id));
  }));

  it('toObject()', () => {
    const doc = User.new({});
    doc.toObject().should.not.be.instanceOf(User.Document);
  });

  it('toObject() - don\'t deep clone getters', () => {
    const db = new Database();
    let User;

    const userSchema = new Schema({
      name: String,
      age: Number
    });

    userSchema.virtual('users').get(() => User.find({}));

    User = db.model('User', userSchema);

    return User.insert({}).then(data => User.findById(data._id)).then(data => {
      data.toObject().should.be.ok;
    });
  });

  it('toString()', () => {
    const doc = User.new({});
    doc.toString().should.eql(JSON.stringify(doc));
  });

  it('populate() - object', () => User.insert({}).then(user => {
    const comment = Comment.new({
      author: user._id
    });

    comment.populate('author').author.should.eql(user);
    return user;
  }).then(user => User.removeById(user._id)));

  it('populate() - array', () => Comment.insert([
    {content: 'foo'},
    {content: 'bar'},
    {content: 'baz'},
    {content: 'ha'}
  ]).then(comments => {
    const user = User.new({
      comments: comments.map(comment => comment._id)
    });

    user.populate('comments').comments.toArray().should.eql(comments);
    return comments;
  }).map(comment => Comment.removeById(comment._id)));
});
