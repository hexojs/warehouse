var should = require('chai').should();
var _ = require('lodash');
var Promise = require('bluebird');
var sinon = require('sinon');
var WarehouseError = require('../../lib/error');
var util = require('util');

describe('Model', function(){
  var Database = require('../..');
  var Schema = Database.Schema;
  var SchemaType = Database.SchemaType;

  var db = new Database();

  var userSchema = new Schema({
    name: {
      first: String,
      last: String
    },
    email: String,
    age: Number,
    posts: [{type: Schema.Types.CUID, ref: 'Post'}]
  });

  userSchema.virtual('name.full').get(function(){
    return this.name.first + ' ' + this.name.last;
  });

  var postSchema = new Schema({
    title: String,
    content: String,
    user_id: {type: Schema.Types.CUID, ref: 'User'},
    created: Date
  });

  var User = db.model('User', userSchema);
  var Post = db.model('Post', postSchema);

  it('new()', function(){
    var user = User.new({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    });

    user._id.should.exist;
    user.name.first.should.eql('John');
    user.name.last.should.eql('Doe');
    user.name.full.should.eql('John Doe');
    user.email.should.eql('abc@example.com');
    user.age.should.eql(20);
    user.posts.should.eql([]);
  });

  it('findById()', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      User.findById(data._id).should.eql(data);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('findById() - lean', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      User.findById(data._id, {lean: true}).name.should.not.ownProperty('full');
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('insert()', function(){
    var listener = sinon.spy(function(data){
      User.findById(data._id).should.exist;
    });

    User.once('insert', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      User.findById(data._id).should.exist;
      User.length.should.eql(1);
      listener.calledOnce.should.be.true;
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('insert() - no id', function(){
    var doc = User.new();
    delete doc._id;

    return User.insert(doc).catch(function(err){
      err.should.be
        .instanceOf(WarehouseError)
        .property('message', 'ID is not defined');
    });
  });

  it('insert() - already existed', function(){
    var user;

    return User.insert({}).then(function(data){
      user = data;
      return User.insert(data);
    }).finally(function(){
      return User.removeById(user._id);
    }).catch(function(err){
      err.should.be
        .instanceOf(WarehouseError)
        .property('message', 'ID `' + user._id + '` has been used');
    });
  });

  it('insert() - hook', function(){
    var db = new Database();
    var testSchema = new Schema();

    var preHook = sinon.spy(function(data){
      should.not.exist(Test.findById(data._id));
      data.foo.should.eql('bar');
    });

    var postHook = sinon.spy(function(data){
      Test.findById(data._id).should.exist;
      data.foo.should.eql('bar');
    });

    testSchema.pre('save', preHook);
    testSchema.post('save', postHook);

    var Test = db.model('Test', testSchema);

    return Test.insert({foo: 'bar'}).then(function(){
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('insert() - array', function(){
    return User.insert([
      {
        name: {first: 'John', last: 'Doe'},
        email: 'abc@example.com',
        age: 20
      },
      {
        name: {first: 'Andy', last: 'Baker'},
        email: 'andy@example.com',
        age: 30
      }
    ]).then(function(data){
      data.length = 2;
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('insert() - sync problem', function(callback){
    var db = new Database();
    var testSchema = new Schema();

    testSchema.pre('save', function(data){
      var item = Test.findOne({id: data.id});
      if (item) throw new Error('ID "' + data.id + '" has been used.');
    });

    var Test = db.model('Test', testSchema);

    Test.insert([
      {id: 1},
      {id: 1}
    ]).catch(function(err){
      err.should.have.property('message', 'ID "1" has been used.');
      callback();
    });
  });

  it('save() - insert', function(){
    return User.save({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      User.findById(data._id).should.exist;
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('save() - replace', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      data.age = 30;
      return User.save(data);
    }).then(function(data){
      data.age.should.eql(30);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById()', function(){
    var listener = sinon.spy(function(data){
      User.findById(data._id).age.should.eql(30);
    });

    User.once('update', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {age: 30});
    }).then(function(data){
      data.age.should.eql(30);
      listener.calledOnce.should.be.true;
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - object', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {name: {first: 'Jerry'}});
    }).then(function(data){
      data.name.first.should.eql('Jerry');
      data.name.last.should.eql('Doe');
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - dot notation', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {'name.last': 'Smith'});
    }).then(function(data){
      data.name.first.should.eql('John');
      data.name.last.should.eql('Smith');
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - operator', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {age: {$inc: 5}});
    }).then(function(data){
      data.age.should.eql(25);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - operator in first class', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {$inc: {age: 5}});
    }).then(function(data){
      data.age.should.eql(25);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - $set', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {$set: {age: 25}});
    }).then(function(data){
      data.age.should.eql(25);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - $unset', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {$unset: {email: true}});
    }).then(function(data){
      should.not.exist(data.email);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - $unset false', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {$unset: {email: false}});
    }).then(function(data){
      data.email.should.eql('abc@example.com');
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - $rename', function(){
    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {$rename: {email: 'address'}});
    }).then(function(data){
      data.address.should.eql('abc@example.com');
      should.not.exist(data.email);
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('updateById() - id not exist', function(){
    return User.updateById('foo', {}).catch(function(err){
      err.should.be
        .instanceOf(WarehouseError)
        .property('message', 'ID `foo` does not exist');
    });
  });

  it('updateById() - hook', function(){
    var db = new Database();
    var testSchema = new Schema();
    var Test = db.model('Test', testSchema);

    var preHook = sinon.spy(function(data){
      should.not.exist(Test.findById(data._id).baz);
    });

    var postHook = sinon.spy(function(data){
      Test.findById(data._id).baz.should.eql(1);
    });

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      testSchema.pre('save', preHook);
      testSchema.post('save', postHook);

      return Test.updateById(data._id, {baz: 1});
    }).then(function(){
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('update()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 20},
      {age: 40}
    ]).then(function(data) {
      return User.update({age: 20}, {email: 'A'}).then(function(updated){
        updated[0]._id.should.eql(data[1]._id);
        updated[1]._id.should.eql(data[3]._id);
        updated[0].email.should.eql('A');
        updated[1].email.should.eql('A');
        return data;
      });
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('replaceById()', function(){
    function validate(data){
      data.name.first.should.eql('Mary');
      data.name.last.should.eql('White');
      data.age.should.eql(40);
      data.should.not.ownProperty('email');
    }

    var listener = sinon.spy(function(data){
      validate(User.findById(data._id));
    });

    User.once('update', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data) {
      return User.replaceById(data._id, {
        name: {first: 'Mary', last: 'White'},
        age: 40
      });
    }).then(function(data){
      validate(data);
      listener.calledOnce.should.be.true;
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it('replaceById() - id not exist', function(){
    return User.replaceById('foo', {}).catch(function(err){
      err.should.be
        .instanceOf(WarehouseError)
        .property('message', 'ID `foo` does not exist');
    });
  });

  it('replaceById() - pre-hook', function(){
    var db = new Database();
    var testSchema = new Schema();
    var Test = db.model('Test', testSchema);

    var preHook = sinon.spy(function(data){
      Test.findById(data._id).foo.should.eql('bar');
    });

    var postHook = sinon.spy(function(data){
      Test.findById(data._id).foo.should.eql('baz');
    });

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      testSchema.pre('save', preHook);
      testSchema.post('save', postHook);

      return Test.replaceById(data._id, {foo: 'baz'});
    }).then(function(){
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('replace()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 20},
      {age: 40}
    ]).then(function(data) {
      return User.replace({age: 20}, {email: 'A'}).then(function(updated){
        updated[0]._id.should.eql(data[1]._id);
        updated[1]._id.should.eql(data[3]._id);
        updated[0].email.should.eql('A');
        updated[1].email.should.eql('A');
        return data;
      });
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('removeById()', function(){
    var listener = sinon.spy(function(data){
      should.not.exist(User.findById(data._id));
    });

    User.once('remove', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.removeById(data._id);
    }).then(function(data){
      listener.calledOnce.should.be.true;
      should.not.exist(User.findById(data._id));
    })
  });

  it('removeById() - id not exist', function(){
    return User.removeById('foo', {}).catch(function(err){
      err.should.be
        .instanceOf(WarehouseError)
        .property('message', 'ID `foo` does not exist');
    });
  });

  it('removeById() - hook', function(){
    var db = new Database();
    var testSchema = new Schema();
    var Test = db.model('Test', testSchema);

    var preHook = sinon.spy(function(data){
      Test.findById(data._id).should.exist;
    });

    var postHook = sinon.spy(function(data){
      should.not.exist(Test.findById(data._id));
    });

    testSchema.pre('remove', preHook);
    testSchema.post('remove', postHook);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.removeById(data._id);
    }).then(function(){
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('remove()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 20},
      {age: 40}
    ]).then(function(data){
      return User.remove({age: 20}).then(function(removed){
        should.not.exist(User.findById(data[1]._id));
        should.not.exist(User.findById(data[3]._id));
        return [data[0], data[2], data[4]];
      });
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('destroy()', function(){
    var Test = db.model('Test');
    Test.destroy();
    should.not.exist(db._models.Test);
  });

  it('count()', function(){
    Post.length.should.eql(Post.count());
  });

  it('forEach()', function(){
    var count = 0;

    return Post.insert([
      {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.forEach(function(item, i){
        item.should.eql(data[i]);
        i.should.eql(count++);
      });

      count.should.eql(data.length);
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('toArray()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.toArray().should.eql(data);
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('find()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var query = User.find({age: 20});
      query.data.should.eql(data.slice(1, 3));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - blank', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var query = User.find({});
      query.data.should.eql(data);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - operator', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var query = User.find({age: {$gt: 20}});
      query.data.should.eql(data.slice(2));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - limit', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var query = User.find({age: {$gte: 20}}, {limit: 2});
      query.data.should.eql(data.slice(1, 3));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - skip', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var query = User.find({age: {$gte: 20}}, {skip: 1});
      query.data.should.eql(data.slice(2));

      // with limit
      query = User.find({age: {$gte: 20}}, {limit: 1, skip: 1});
      query.data.should.eql(data.slice(2, 3));

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - lean', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var query = User.find({age: {$gt: 20}}, {lean: true});
      query.should.be.a('array');
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - $and', function(){
    return User.insert([
      {name: {first: 'John', last: 'Doe'}, age: 20},
      {name: {first: 'Jane', last: 'Doe'}, age: 25},
      {name: {first: 'Jack', last: 'White'}, age: 30}
    ]).then(function(data){
      var query = User.find({
        $and: [
          {'name.last': 'Doe'},
          {age: {$gt: 20}}
        ]
      });

      query.toArray().should.eql([data[1]]);

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - $or', function(){
    return User.insert([
      {name: {first: 'John', last: 'Doe'}, age: 20},
      {name: {first: 'Jane', last: 'Doe'}, age: 25},
      {name: {first: 'Jack', last: 'White'}, age: 30}
    ]).then(function(data){
      var query = User.find({
        $or: [
          {'name.last': 'White'},
          {age: {$gt: 20}}
        ]
      });

      query.toArray().should.eql(data.slice(1));

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - $nor', function(){
    return User.insert([
      {name: {first: 'John', last: 'Doe'}, age: 20},
      {name: {first: 'Jane', last: 'Doe'}, age: 25},
      {name: {first: 'Jack', last: 'White'}, age: 30}
    ]).then(function(data){
      var query = User.find({
        $nor: [
          {'name.last': 'White'},
          {age: {$gt: 20}}
        ]
      });

      query.toArray().should.eql([data[0]]);

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - $not', function(){
    return User.insert([
      {name: {first: 'John', last: 'Doe'}, age: 20},
      {name: {first: 'Jane', last: 'Doe'}, age: 25},
      {name: {first: 'Jack', last: 'White'}, age: 30}
    ]).then(function(data){
      var query = User.find({
        $not: {'name.last': 'Doe'}
      });

      query.toArray().should.eql(data.slice(2));

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('find() - $where', function(){
    return User.insert([
      {name: {first: 'John', last: 'Doe'}, age: 20},
      {name: {first: 'Jane', last: 'Doe'}, age: 25},
      {name: {first: 'Jack', last: 'White'}, age: 30}
    ]).then(function(data){
      var query = User.find({
        $where: function(){
          return this.name.last === 'Doe';
        }
      });

      query.toArray().should.eql(data.slice(0, 2));

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('findOne()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      User.findOne({age: {$gt: 20}}).should.eql(data[2]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('findOne() - lean', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      User.findOne({age: {$gt: 20}}, {lean: true})._id.should.eql(data[2]._id);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('sort()', function(){
    return User.insert([
      {age: 15},
      {age: 35},
      {age: 10}
    ]).then(function(data){
      var query = User.sort('age');
      query.data[0].should.eql(data[2]);
      query.data[1].should.eql(data[0]);
      query.data[2].should.eql(data[1]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('sort() - descending', function(){
    return User.insert([
      {age: 15},
      {age: 35},
      {age: 10}
    ]).then(function(data){
      var query = User.sort('age', -1);
      query.data[0].should.eql(data[1]);
      query.data[1].should.eql(data[0]);
      query.data[2].should.eql(data[2]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('sort() - multi', function(){
    return User.insert([
      {age: 15, email: 'A'},
      {age: 30, email: 'B'},
      {age: 20, email: 'C'},
      {age: 20, email: 'D'}
    ]).then(function(data){
      var query = User.sort('age email');
      query.data[0].should.eql(data[0]);
      query.data[1].should.eql(data[2]);
      query.data[2].should.eql(data[3]);
      query.data[3].should.eql(data[1]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('eq()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      for (var i = 0, len = data.length; i < len; i++){
        Post.eq(i).should.eql(data[i]);
      }

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('eq() - negative index', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      for (var i = 1, len = data.length; i <= len; i++){
        Post.eq(-i).should.eql(data[len - i]);
      }

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('first()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.first().should.eql(data[0]);

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('last()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.last().should.eql(data[data.length - 1]);

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - no arguments', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice().data.should.eql(data);
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - one argument', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(2).data.should.eql(data.slice(2));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - one negative argument', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(-2).data.should.eql(data.slice(-2));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - two arguments', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(2, 4).data.should.eql(data.slice(2, 4));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - start + negative end index', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(1, -1).data.should.eql(data.slice(1, -1));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - two negative arguments', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(-3, -1).data.should.eql(data.slice(-3, -1));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - start > end', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(-1, -3).data.should.eql(data.slice(-1, -3));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - index overflow', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(1, 100).data.should.eql(data.slice(1, 100));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('slice() - index overflow 2', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.slice(100, 200).data.should.eql(data.slice(100, 200));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('limit()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.limit(2).data.should.eql(data.slice(0, 2));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('skip()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      Post.skip(2).data.should.eql(data.slice(2));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('reverse()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var query = Post.reverse();

      for (var i = 0, len = data.length; i < len; i++){
        query.data[i].should.eql(data[len - i - 1]);
      }

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('shuffle()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var query = Post.shuffle();
      _.sortBy(query.data, '_id').should.eql(_.sortBy(data, '_id'));
      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('map()', function(){
    return Post.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var num = 0;

      var d1 = Post.map(function(item, i){
        i.should.eql(num++);
        return item._id;
      });

      var d2 = data.map(function(item){
        return item._id;
      });

      d1.should.eql(d2);

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('reduce()', function(){
    return Post.insert([
      {email: 'A'},
      {email: 'B'},
      {email: 'C'}
    ]).then(function(data){
      var num = 1;

      var sum = Post.reduce(function(sum, item, i){
        i.should.eql(num++);
        return {email: sum.email + item.email};
      });

      sum.email.should.eql('ABC');

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('reduce() - with initial', function(){
    return Post.insert([
      {email: 'A'},
      {email: 'B'},
      {email: 'C'}
    ]).then(function(data){
      var num = 0;

      var sum = Post.reduce(function(sum, item, i){
        i.should.eql(num++);
        return sum + item.email;
      }, '_');

      sum.should.eql('_ABC');

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('reduceRight()', function(){
    return Post.insert([
      {email: 'A'},
      {email: 'B'},
      {email: 'C'}
    ]).then(function(data){
      var num = 1;

      var sum = Post.reduceRight(function(sum, item, i){
        i.should.eql(num--);
        return {email: sum.email + item.email};
      });

      sum.email.should.eql('CBA');

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('reduceRight() - with initial', function(){
    return Post.insert([
      {email: 'A'},
      {email: 'B'},
      {email: 'C'}
    ]).then(function(data){
      var num = 2;

      var sum = Post.reduceRight(function(sum, item, i){
        i.should.eql(num--);
        return sum + item.email;
      }, '_');

      sum.should.eql('_CBA');

      return data;
    }).map(function(item){
      return Post.removeById(item._id);
    });
  });

  it('filter()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var num = 0;

      var query = User.filter(function(data, i){
        i.should.eql(num++);
        return data.age > 20;
      });

      query.data.should.eql(data.slice(2));

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('every()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var num = 0;

      User.every(function(data, i){
        i.should.eql(num++);
        return data.age;
      }).should.be.true;

      User.every(function(data, i){
        return data.age > 10;
      }).should.be.false;

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('some()', function(){
    return User.insert([
      {age: 10},
      {age: 20},
      {age: 30},
      {age: 40}
    ]).then(function(data){
      var num = 0;

      User.some(function(data, i){
        return data.age > 10;
      }).should.be.true;

      User.some(function(data, i){
        i.should.eql(num++);
        return data.age < 0;
      }).should.be.false;

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('populate() - object', function(){
    var user, post;

    return User.insert({}).then(function(user_){
      user = user_;

      return Post.insert({
        user_id: user_._id
      });
    }).then(function(post_){
      post = post_;
      return Post.populate('user_id');
    }).then(function(result){
      result.first().user_id.should.eql(user);

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(post._id)
      ]);
    });
  });

  it('populate() - array', function(){
    var posts, user;

    return Post.insert([
      {title: 'ABCD'},
      {title: 'ACD'},
      {title: 'CDE'},
      {title: 'XYZ'}
    ]).then(function(posts_){
      posts = posts_;

      return User.insert({
        posts: _.map(posts, '_id')
      });
    }).then(function(user_){
      user = user_;
      return User.populate('posts');
    }).then(function(result){
      var query = result.first().posts;

      query.should.be.an.instanceOf(Post.Query);
      query.toArray().should.eql(posts);

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(posts[0]._id),
        Post.removeById(posts[1]._id),
        Post.removeById(posts[2]._id),
        Post.removeById(posts[3]._id)
      ]);
    });
  });

  it('populate() - match', function(){
    var posts, user;

    return Post.insert([
      {title: 'ABCD'},
      {title: 'ACD'},
      {title: 'CDE'},
      {title: 'XYZ'}
    ]).then(function(posts_){
      posts = posts_;

      return User.insert({
        posts: _.map(posts, '_id')
      });
    }).then(function(user_){
      user = user_;
      return User.populate({
        path: 'posts',
        match: {title: /^A/}
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(0, 2));

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(posts[0]._id),
        Post.removeById(posts[1]._id),
        Post.removeById(posts[2]._id),
        Post.removeById(posts[3]._id)
      ]);
    });
  });

  it('populate() - sort', function(){
    var posts, user;

    return Post.insert([
      {title: 'XYZ'},
      {title: 'ABCD'},
      {title: 'CDE'},
      {title: 'ACD'}
    ]).then(function(posts_){
      posts = posts_;

      return User.insert({
        posts: _.map(posts, '_id')
      });
    }).then(function(user_){
      user = user_;

      return User.populate({
        path: 'posts',
        sort: 'title'
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql([
        posts[1], posts[3], posts[2], posts[0]
      ]);

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(posts[0]._id),
        Post.removeById(posts[1]._id),
        Post.removeById(posts[2]._id),
        Post.removeById(posts[3]._id)
      ]);
    });
  });

  it('populate() - limit', function(){
    var posts, user;

    return Post.insert([
      {title: 'XYZ'},
      {title: 'ABCD'},
      {title: 'CDE'},
      {title: 'ACD'}
    ]).then(function(posts_){
      posts = posts_;

      return User.insert({
        posts: _.map(posts, '_id')
      });
    }).then(function(user_){
      user = user_;

      return User.populate({
        path: 'posts',
        limit: 2
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(0, 2));

      // with match
      return User.populate({
        path: 'posts',
        match: {title: /D/},
        limit: 2
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(1, 3));

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(posts[0]._id),
        Post.removeById(posts[1]._id),
        Post.removeById(posts[2]._id),
        Post.removeById(posts[3]._id)
      ]);
    });
  });

  it('populate() - skip', function(){
    var posts, user;

    return Post.insert([
      {title: 'XYZ'},
      {title: 'ABCD'},
      {title: 'CDE'},
      {title: 'ACD'}
    ]).then(function(posts_){
      posts = posts_;

      return User.insert({
        posts: _.map(posts, '_id')
      });
    }).then(function(user_){
      user = user_;

      return User.populate({
        path: 'posts',
        skip: 2
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(2));

      // with match
      return User.populate({
        path: 'posts',
        match: {title: /D/},
        skip: 2
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(3));

      // with limit
      return User.populate({
        path: 'posts',
        limit: 2,
        skip: 1
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(1, 3));

      // with match & limit
      return User.populate({
        path: 'posts',
        match: {title: /D/},
        limit: 2,
        skip: 1
      });
    }).then(function(result){
      result.first().posts.toArray().should.eql(posts.slice(2));

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(posts[0]._id),
        Post.removeById(posts[1]._id),
        Post.removeById(posts[2]._id),
        Post.removeById(posts[3]._id)
      ]);
    });
  });

  it('static method', function(){
    var schema = new Schema();

    schema.static('add', function(value){
      return this.insert(value);
    });

    var Test = db.model('Test', schema);

    Test.add({name: 'foo'}).then(function(data){
      data.name.should.eql('foo');
    });

    Test.destroy();
  });

  it('instance method', function(){
    var schema = new Schema();

    schema.method('getName', function(){
      return this.name;
    });

    var Test = db.model('Test', schema);

    Test.insert({name: 'foo'}).then(function(data){
      data.getName().should.eql('foo');
    });

    Test.destroy();
  });

  it('_import()', function(){
    var schema = new Schema({
      _id: {type: String, required: true},
      bool: Boolean
    });

    var Test = db.model('Test', schema);

    Test._import([
      {_id: 'A', bool: 1},
      {_id: 'B', bool: 0}
    ]);

    Test.length.should.eql(2);

    Test.toArray().should.eql([
      Test.new({_id: 'A', bool: true}),
      Test.new({_id: 'B', bool: false})
    ]);

    Test.destroy();
  });

  it('_export()', function(){
    var schema = new Schema({
      _id: {type: String, required: true},
      bool: Boolean
    });

    var Test = db.model('Test', schema);

    return Test.insert([
      {_id: 'A', bool: true},
      {_id: 'B', bool: false}
    ]).then(function(data){
      Test._export().should.eql(JSON.stringify([
        {_id: 'A', bool: 1},
        {_id: 'B', bool: 0}
      ]));

      return Test.destroy();
    });
  });

  it('_export() - should not save undefined value', function(){
    var CacheType = function(){
      SchemaType.apply(this, arguments);
    };

    util.inherits(CacheType, SchemaType);

    CacheType.prototype.value = function(){
      return;
    };

    var schema = new Schema({
      cache: CacheType
    });

    var Test = db.model('Test', schema);

    return Test.insert({
      cache: 'test'
    }).then(function(data){
      data.cache.should.exist;
      should.not.exist(JSON.parse(Test._export())[0].cache);

      return Test.destroy();
    });
  });
});