import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import path from 'path';
import Promise from 'bluebird';
import sinon from 'sinon';
import Database from '../../src/database';
import Model from '../../src/model';
import fs from 'fs';
const promisifyFs = Promise.promisifyAll(fs);

const DB_PATH = path.join(path.dirname(__dirname), 'fixtures', 'db.json');
const DB_VERSION = 1;

describe('Database', () => {
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

  it('save()', () => db.save().then(() => promisifyFs.readFileAsync(DB_PATH)).then(data => {
    // TODO: fix
    // @ts-ignore
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

  it('toJSON()', () => {
    const db = new Database({
      path: DB_PATH,
      version: 0
    });

    return db.load().then(() => {
      const model = db.model('Test');
      const json = db.toJSON();
      json.meta.version.should.eql(0);
      json.models.Test.should.eql(model);
      console.log(db.toJSON());
    });
  });
});
