'use strict';

const should = require('chai').should(); // eslint-disable-line
const path = require('path');
const Promise = require('bluebird');
const sinon = require('sinon');
const fs = Promise.promisifyAll(require('fs'));

const DB_PATH = path.join(path.dirname(__dirname), 'fixtures', 'db.json');
const DB_VERSION = 1;

describe('Database', () => {
  const Database = require('../..');
  const Model = require('../../lib/model');
  const Schema = Database.Schema;
  const db = new Database({path: DB_PATH, version: DB_VERSION});

  const TestModel = db.model('Test', new Schema({
    _id: {type: String, required: true}
  }));

  before(() => TestModel.insert([
    {_id: 'A'},
    {_id: 'B'},
    {_id: 'C'}
  ]));

  it('model() - get', () => {
    const Test = db.model('Test');
    Test.data.should.eql(TestModel.data);
  });

  it('model() - create', () => {
    const Post = db.model('Post');
    Post.should.be.an.instanceOf(Model);
    db._models.Post.should.exist;
    Post.destroy();
  });

  it('load()', () => {
    const db = new Database({path: DB_PATH});

    return db.load().then(() => {
      const Test = db.model('Test');

      Test.toArray().should.eql([
        Test.new({_id: 'A'}),
        Test.new({_id: 'B'}),
        Test.new({_id: 'C'})
      ]);
    });
  });

  it('load() - upgrade', () => {
    const onUpgrade = sinon.spy((oldVersion, newVersion) => {
      oldVersion.should.eql(DB_VERSION);
      newVersion.should.eql(2);
    });

    const db = new Database({
      path: DB_PATH,
      version: 2,
      onUpgrade
    });

    return db.load().then(() => {
      onUpgrade.calledOnce.should.be.true;
    });
  });

  it('load() - downgrade', () => {
    const onDowngrade = sinon.spy((oldVersion, newVersion) => {
      oldVersion.should.eql(DB_VERSION);
      newVersion.should.eql(0);
    });

    const db = new Database({
      path: DB_PATH,
      version: 0,
      onDowngrade
    });

    return db.load().then(() => {
      onDowngrade.calledOnce.should.be.true;
    });
  });

  it('save()', () => db.save().then(() => fs.readFileAsync(DB_PATH, 'utf8')).then(data => {
    const json = JSON.parse(data);

    json.meta.should.eql({
      version: DB_VERSION,
      warehouse: Database.version
    });

    json.models.should.eql({
      Test: [
        {_id: 'A'},
        {_id: 'B'},
        {_id: 'C'}
      ]
    });
  }));
});
