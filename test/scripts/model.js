var should = require('chai').should(),
  Promise = require('bluebird');

describe('model', function(){
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

  userSchema.method('addPost', function(data){
    var self = this;
    data.user_id = this._id;

    return Post.insert(data);
  });

  var postSchema = new Schema({
    title: String,
    content: String,
    user_id: {type: Schema.Types.CUID, ref: 'User'},
    created: Date
  });

  postSchema.static('findLatest', function(){
    return this.sort('-created').first();
  });

  var User = db.model('User', userSchema),
    Post = db.model('Post', postSchema);

  it('apply schema methods', function(){
    Post.findLatest.should.be.a('function');
    User.Document.prototype.addPost.should.be.a('function');
  });

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

  it.skip('insert() - pre-hook');

  it.skip('insert() - post-hook');

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

  it.skip('updateById() - id not exist');

  it.skip('updateById() - pre-hook');

  it.skip('updateById() - post-hook');

  it.skip('update()');

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

  it.skip('replaceById() - pre-hook');

  it.skip('replaceById() - post-hook');

  it.skip('replace()');

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

  it.skip('removeById() - pre-hook');

  it.skip('removeById() - post-hook');

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

  it.skip('find() - limit');

  it.skip('find() - skip');

  it.skip('find() - lean');

  it.skip('findOne()');

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

  it.skip('shuffle()');

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
    })
  });

  it.skip('populate()');

  it.skip('static method');

  it.skip('instance method');

  it.skip('_import()');

  it.skip('_export()');
});