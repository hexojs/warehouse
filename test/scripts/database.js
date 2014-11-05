var should = require('chai').should(),
  path = require('path'),
  Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs'));

var DB_PATH = path.join(path.dirname(__dirname), 'fixtures', 'db.json'),
  DB_VERSION = 1;

describe('Database', function(){
  var Database = require('../..'),
    Model = require('../../lib/model'),
    Schema = Database.Schema,
    db = new Database({path: DB_PATH, version: DB_VERSION});

  var TestModel = db.model('Test', new Schema({
    _id: {type: String, required: true}
  }));

  before(function(){
    return TestModel.insert([
      {_id: 'A'},
      {_id: 'B'},
      {_id: 'C'}
    ]);
  });

  it('model() - get', function(){
    var Test = db.model('Test');
    Test.data.should.eql(TestModel.data);
  });

  it('model() - create', function(){
    var Post = db.model('Post');
    Post.should.be.an.instanceOf(Model);
    db._models.Post.should.exist;
    Post.destroy();
  });

  it('load()', function(){
    var db = new Database({path: DB_PATH});

    return db.load().then(function(){
      var Test = db.model('Test');

      Test.toArray().should.eql([
        Test.new({_id: 'A'}),
        Test.new({_id: 'B'}),
        Test.new({_id: 'C'})
      ]);
    });
  });

  it('load() - upgrade', function(){
    var executed = false;

    var db = new Database({
      path: DB_PATH,
      version: 2,
      onUpgrade: function(oldVersion, newVersion){
        oldVersion.should.eql(DB_VERSION);
        newVersion.should.eql(2);
        executed = true;
      }
    });

    return db.load().then(function(){
      executed.should.be.true;
    });
  });

  it('load() - downgrade', function(){
    var executed = false;

    var db = new Database({
      path: DB_PATH,
      version: 0,
      onDowngrade: function(oldVersion, newVersion){
        oldVersion.should.eql(DB_VERSION);
        newVersion.should.eql(0);
        executed = true;
      }
    });

    return db.load().then(function(){
      executed.should.be.true;
    });
  });

  it('save()', function(){
    return db.save().then(function(){
      return fs.readFileAsync(DB_PATH, 'utf8');
    }).then(function(data){
      var json = JSON.parse(data);

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
    });
  });
});