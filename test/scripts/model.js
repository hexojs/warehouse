var should = require('chai').should(),
  _ = require('lodash');

describe('Model', function(){
  var Database = require('../..'),
    Schema = Database.Schema;

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

  var User = db.model('User', userSchema),
    Post = db.model('Post', postSchema);

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
    var emitted = false;

    User.once('insert', function(){
      emitted = true;
    });

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      User.findById(data._id).should.exist;
      User.length.should.eql(1);
      emitted.should.be.true;
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it.skip('insert() - no id');

  it.skip('insert() - already existed');

  it('insert() - pre-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      executed = false;

    testSchema.pre('save', function(data){
      data.foo.should.eql('bar');
      executed = true;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({foo: 'bar'}).then(function(){
      executed.should.be.true;
    });
  });

  it('insert() - post-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      executed = false;

    testSchema.post('save', function(data){
      data.foo.should.eql('bar');
      executed = true;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({foo: 'bar'}).then(function(){
      executed.should.be.true;
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
    var emitted = false;

    User.once('update', function(){
      emitted = true;
    });

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.updateById(data._id, {age: 30});
    }).then(function(data){
      data.age.should.eql(30);
      emitted.should.be.true;
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

  it('updateById() - dot key', function(){
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

  it.skip('updateById() - $set');

  it.skip('updateById() - $unset');

  it.skip('updateById() - $rename');

  it.skip('updateById() - id not exist');

  it('updateById() - pre-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      count = 0;

    testSchema.pre('save', function(data){
      data.foo.should.eql('bar');
      count++;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.updateById(data._id, {baz: 1});
    }).then(function(){
      count.should.eql(2);
    });
  });

  it('updateById() - post-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      count = 0;

    testSchema.post('save', function(data){
      data.foo.should.eql('bar');
      count++;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.updateById(data._id, {baz: 1});
    }).then(function(){
      count.should.eql(2);
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
    var emitted = false;

    User.once('update', function(){
      emitted = true;
    });

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
      emitted.should.be.true;
      data.name.first.should.eql('Mary');
      data.name.last.should.eql('White');
      data.age.should.eql(40);
      data.should.not.ownProperty('email');
      return data;
    }).then(function(data){
      return User.removeById(data._id);
    });
  });

  it.skip('replaceById() - id not exist');

  it('replaceById() - pre-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      count = 0;

    testSchema.pre('save', function(data){
      data.foo.should.eql('bar');
      count++;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.replaceById(data._id, {foo: 'bar'});
    }).then(function(){
      count.should.eql(2);
    });
  });

  it('replaceById() - post-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      count = 0;

    testSchema.post('save', function(data){
      data.foo.should.eql('bar');
      count++;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.replaceById(data._id, {foo: 'bar'});
    }).then(function(){
      count.should.eql(2);
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
    var emitted = false;

    User.once('remove', function(){
      emitted = true;
    });

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(function(data){
      return User.removeById(data._id);
    }).then(function(data){
      emitted.should.be.true;
      should.not.exist(User.findById(data._id));
    })
  });

  it.skip('removeById() - id not exist');

  it('removeById() - pre-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      executed = false;

    testSchema.pre('remove', function(data){
      data.foo.should.eql('bar');
      executed = true;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.removeById(data._id);
    }).then(function(){
      executed.should.be.true;
    });
  });

  it('removeById() - post-hook', function(){
    var db = new Database(),
      testSchema = new Schema(),
      executed = false;

    testSchema.post('remove', function(data){
      data.foo.should.eql('bar');
      executed = true;
    });

    var Test = db.model('Test', testSchema);

    return Test.insert({
      foo: 'bar'
    }).then(function(data){
      return Test.removeById(data._id);
    }).then(function(){
      executed.should.be.true;
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
      var query = User.find({age: {$gte: 20}}, {skip: 2});
      query.data.should.eql(data.slice(3));
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

  it.skip('populate()');

  it.skip('static method');

  it.skip('instance method');

  it.skip('_import()');

  it.skip('_export()');
});