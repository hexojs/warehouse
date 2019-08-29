'use strict';

const should = require('chai').use(require('chai-as-promised')).should();
const sortBy = require('lodash/sortBy');
const Promise = require('bluebird');
const sinon = require('sinon');
const cuid = require('cuid');

describe('Model', () => {
  const Database = require('../..');
  const Schema = Database.Schema;
  const SchemaType = Database.SchemaType;

  const db = new Database();

  const userSchema = new Schema({
    name: {
      first: String,
      last: String
    },
    email: String,
    age: Number,
    posts: [{type: Schema.Types.CUID, ref: 'Post'}]
  });

  userSchema.virtual('name.full').get(function() {
    return `${this.name.first} ${this.name.last}`;
  });

  const postSchema = new Schema({
    title: String,
    content: String,
    user_id: {type: Schema.Types.CUID, ref: 'User'},
    created: Date
  });

  const User = db.model('User', userSchema);
  const Post = db.model('Post', postSchema);

  it('new()', () => {
    const user = User.new({
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

  it('findById()', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => {
    User.findById(data._id).should.eql(data);
    return data;
  }).then(data => User.removeById(data._id)));

  it('findById() - lean', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => {
    User.findById(data._id, {lean: true}).name.should.not.ownProperty('full');
    return data;
  }).then(data => User.removeById(data._id)));

  it('insert()', () => {
    const listener = sinon.spy(data => {
      User.findById(data._id).should.exist;
    });

    User.once('insert', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(data => {
      User.findById(data._id).should.exist;
      User.length.should.eql(1);
      listener.calledOnce.should.be.true;
      return data;
    }).then(data => User.removeById(data._id));
  });

  it('insert() - no id', () => {
    const doc = User.new();
    delete doc._id;

    return User.insert(doc).should.eventually.be.rejected;
  });

  it('insert() - already existed', () => {
    let user;

    return User.insert({}).then(data => {
      user = data;
      return User.insert(data);
    }).finally(() => User.removeById(user._id)).should.eventually.be.rejected;
  });

  it('insert() - hook', () => {
    const db = new Database();
    const testSchema = new Schema();
    let Test;

    const preHook = sinon.spy(data => {
      should.not.exist(Test.findById(data._id));
      data.foo.should.eql('bar');
    });

    const postHook = sinon.spy(data => {
      Test.findById(data._id).should.exist;
      data.foo.should.eql('bar');
    });

    testSchema.pre('save', preHook);
    testSchema.post('save', postHook);

    Test = db.model('Test', testSchema);

    return Test.insert({foo: 'bar'}).then(() => {
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('insert() - array', () => User.insert([
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
  ]).then(data => {
    data.length = 2;
    return data;
  }).map(item => User.removeById(item._id)));

  it('insert() - sync problem', () => {
    const db = new Database();
    const testSchema = new Schema();
    let Test;

    testSchema.pre('save', data => {
      const item = Test.findOne({id: data.id});
      if (item) throw new Error(`ID "${data.id}" has been used.`);
    });

    Test = db.model('Test', testSchema);

    return Promise.all([
      Test.insert({id: 1}),
      Test.insert({id: 1})
    ]).should.eventually.be.rejected;
  });

  it('save() - insert', () => User.save({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => {
    User.findById(data._id).should.exist;
    return data;
  }).then(data => User.removeById(data._id)));

  it('save() - replace', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => {
    data.age = 30;
    return User.save(data);
  }).then(data => {
    data.age.should.eql(30);
    return data;
  }).then(data => User.removeById(data._id)));

  it('save() - sync problem', () => {
    const id = cuid();

    return Promise.all([
      User.save({_id: id, age: 1}),
      User.save({_id: id, age: 2})
    ]).then(() => {
      const user = User.findById(id);

      user.age.should.eql(2);
      User.length.should.eql(1);

      return User.removeById(id);
    });
  });

  it('updateById()', () => {
    const listener = sinon.spy(data => {
      User.findById(data._id).age.should.eql(30);
    });

    User.once('update', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(data => User.updateById(data._id, {age: 30})).then(data => {
      data.age.should.eql(30);
      listener.calledOnce.should.be.true;
      return data;
    }).then(data => User.removeById(data._id));
  });

  it('updateById() - object', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {name: {first: 'Jerry'}})).then(data => {
    data.name.first.should.eql('Jerry');
    data.name.last.should.eql('Doe');
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - dot notation', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {'name.last': 'Smith'})).then(data => {
    data.name.first.should.eql('John');
    data.name.last.should.eql('Smith');
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - operator', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {age: {$inc: 5}})).then(data => {
    data.age.should.eql(25);
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - operator in first class', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {$inc: {age: 5}})).then(data => {
    data.age.should.eql(25);
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - $set', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {$set: {age: 25}})).then(data => {
    data.age.should.eql(25);
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - $unset', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {$unset: {email: true}})).then(data => {
    should.not.exist(data.email);
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - $unset false', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {$unset: {email: false}})).then(data => {
    data.email.should.eql('abc@example.com');
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - $rename', () => User.insert({
    name: {first: 'John', last: 'Doe'},
    email: 'abc@example.com',
    age: 20
  }).then(data => User.updateById(data._id, {$rename: {email: 'address'}})).then(data => {
    data.address.should.eql('abc@example.com');
    should.not.exist(data.email);
    return data;
  }).then(data => User.removeById(data._id)));

  it('updateById() - id not exist', () => User.updateById('foo', {}).should.eventually.be.rejected);

  it('updateById() - hook', () => {
    const db = new Database();
    const testSchema = new Schema();
    const Test = db.model('Test', testSchema);

    const preHook = sinon.spy(data => {
      should.not.exist(Test.findById(data._id).baz);
    });

    const postHook = sinon.spy(data => {
      Test.findById(data._id).baz.should.eql(1);
    });

    return Test.insert({
      foo: 'bar'
    }).then(data => {
      testSchema.pre('save', preHook);
      testSchema.post('save', postHook);

      return Test.updateById(data._id, {baz: 1});
    }).then(() => {
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('update()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 20},
    {age: 40}
  ]).then(data => User.update({age: 20}, {email: 'A'}).then(updated => {
    updated[0]._id.should.eql(data[1]._id);
    updated[1]._id.should.eql(data[3]._id);
    updated[0].email.should.eql('A');
    updated[1].email.should.eql('A');
    return data;
  })).map(item => User.removeById(item._id)));

  it('replaceById()', () => {
    function validate(data) {
      data.name.first.should.eql('Mary');
      data.name.last.should.eql('White');
      data.age.should.eql(40);
      data.should.not.ownProperty('email');
    }

    const listener = sinon.spy(data => {
      validate(User.findById(data._id));
    });

    User.once('update', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(data => User.replaceById(data._id, {
      name: {first: 'Mary', last: 'White'},
      age: 40
    })).then(data => {
      validate(data);
      listener.calledOnce.should.be.true;
      return data;
    }).then(data => User.removeById(data._id));
  });

  it('replaceById() - id not exist', () => User.replaceById('foo', {}).should.eventually.be.rejected);

  it('replaceById() - pre-hook', () => {
    const db = new Database();
    const testSchema = new Schema();
    const Test = db.model('Test', testSchema);

    const preHook = sinon.spy(data => {
      Test.findById(data._id).foo.should.eql('bar');
    });

    const postHook = sinon.spy(data => {
      Test.findById(data._id).foo.should.eql('baz');
    });

    return Test.insert({
      foo: 'bar'
    }).then(data => {
      testSchema.pre('save', preHook);
      testSchema.post('save', postHook);

      return Test.replaceById(data._id, {foo: 'baz'});
    }).then(() => {
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('replace()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 20},
    {age: 40}
  ]).then(data => User.replace({age: 20}, {email: 'A'}).then(updated => {
    updated[0]._id.should.eql(data[1]._id);
    updated[1]._id.should.eql(data[3]._id);
    updated[0].email.should.eql('A');
    updated[1].email.should.eql('A');
    return data;
  })).map(item => User.removeById(item._id)));

  it('removeById()', () => {
    const listener = sinon.spy(data => {
      should.not.exist(User.findById(data._id));
    });

    User.once('remove', listener);

    return User.insert({
      name: {first: 'John', last: 'Doe'},
      email: 'abc@example.com',
      age: 20
    }).then(data => User.removeById(data._id)).then(data => {
      listener.calledOnce.should.be.true;
      should.not.exist(User.findById(data._id));
    });
  });

  it('removeById() - id not exist', () => User.removeById('foo', {}).should.eventually.be.rejected);

  it('removeById() - hook', () => {
    const db = new Database();
    const testSchema = new Schema();
    const Test = db.model('Test', testSchema);

    const preHook = sinon.spy(data => {
      Test.findById(data._id).should.exist;
    });

    const postHook = sinon.spy(data => {
      should.not.exist(Test.findById(data._id));
    });

    testSchema.pre('remove', preHook);
    testSchema.post('remove', postHook);

    return Test.insert({
      foo: 'bar'
    }).then(data => Test.removeById(data._id)).then(() => {
      preHook.calledOnce.should.be.true;
      postHook.calledOnce.should.be.true;
    });
  });

  it('remove()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 20},
    {age: 40}
  ]).then(data => User.remove({age: 20}).then(removed => {
    should.not.exist(User.findById(data[1]._id));
    should.not.exist(User.findById(data[3]._id));
    return [data[0], data[2], data[4]];
  })).map(item => User.removeById(item._id)));

  it('destroy()', () => {
    const Test = db.model('Test');
    Test.destroy();
    should.not.exist(db._models.Test);
  });

  it('count()', () => {
    Post.length.should.eql(Post.count());
  });

  it('forEach()', () => {
    let count = 0;

    return Post.insert(Array(10).fill({})).then(data => {
      Post.forEach((item, i) => {
        item.should.eql(data[i]);
        i.should.eql(count++);
      });

      count.should.eql(data.length);
      return data;
    }).map(item => Post.removeById(item._id));
  });

  it('toArray()', () => Post.insert(Array(10).fill({})).then(data => {
    Post.toArray().should.eql(data);
    return data;
  }).map(item => Post.removeById(item._id)));

  it('find()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = User.find({age: 20});
    query.data.should.eql(data.slice(1, 3));
    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - blank', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = User.find({});
    query.data.should.eql(data);
    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - operator', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = User.find({age: {$gt: 20}});
    query.data.should.eql(data.slice(2));
    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - limit', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = User.find({age: {$gte: 20}}, {limit: 2});
    query.data.should.eql(data.slice(1, 3));
    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - skip', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let query = User.find({age: {$gte: 20}}, {skip: 1});
    query.data.should.eql(data.slice(2));

    // with limit
    query = User.find({age: {$gte: 20}}, {limit: 1, skip: 1});
    query.data.should.eql(data.slice(2, 3));

    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - lean', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = User.find({age: {$gt: 20}}, {lean: true});
    query.should.be.a('array');
    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - $and', () => User.insert([
    {name: {first: 'John', last: 'Doe'}, age: 20},
    {name: {first: 'Jane', last: 'Doe'}, age: 25},
    {name: {first: 'Jack', last: 'White'}, age: 30}
  ]).then(data => {
    const query = User.find({
      $and: [
        {'name.last': 'Doe'},
        {age: {$gt: 20}}
      ]
    });

    query.toArray().should.eql([data[1]]);

    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - $or', () => User.insert([
    {name: {first: 'John', last: 'Doe'}, age: 20},
    {name: {first: 'Jane', last: 'Doe'}, age: 25},
    {name: {first: 'Jack', last: 'White'}, age: 30}
  ]).then(data => {
    const query = User.find({
      $or: [
        {'name.last': 'White'},
        {age: {$gt: 20}}
      ]
    });

    query.toArray().should.eql(data.slice(1));

    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - $nor', () => User.insert([
    {name: {first: 'John', last: 'Doe'}, age: 20},
    {name: {first: 'Jane', last: 'Doe'}, age: 25},
    {name: {first: 'Jack', last: 'White'}, age: 30}
  ]).then(data => {
    const query = User.find({
      $nor: [
        {'name.last': 'White'},
        {age: {$gt: 20}}
      ]
    });

    query.toArray().should.eql([data[0]]);

    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - $not', () => User.insert([
    {name: {first: 'John', last: 'Doe'}, age: 20},
    {name: {first: 'Jane', last: 'Doe'}, age: 25},
    {name: {first: 'Jack', last: 'White'}, age: 30}
  ]).then(data => {
    const query = User.find({
      $not: {'name.last': 'Doe'}
    });

    query.toArray().should.eql(data.slice(2));

    return data;
  }).map(item => User.removeById(item._id)));

  it('find() - $where', () => User.insert([
    {name: {first: 'John', last: 'Doe'}, age: 20},
    {name: {first: 'Jane', last: 'Doe'}, age: 25},
    {name: {first: 'Jack', last: 'White'}, age: 30}
  ]).then(data => {
    const query = User.find({
      $where: function() {
        return this.name.last === 'Doe';
      }
    });

    query.toArray().should.eql(data.slice(0, 2));

    return data;
  }).map(item => User.removeById(item._id)));

  it('findOne()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    User.findOne({age: {$gt: 20}}).should.eql(data[2]);
    return data;
  }).map(item => User.removeById(item._id)));

  it('findOne() - lean', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    User.findOne({age: {$gt: 20}}, {lean: true})._id.should.eql(data[2]._id);
    return data;
  }).map(item => User.removeById(item._id)));

  it('sort()', () => User.insert([
    {age: 15},
    {age: 35},
    {age: 10}
  ]).then(data => {
    const query = User.sort('age');
    query.data[0].should.eql(data[2]);
    query.data[1].should.eql(data[0]);
    query.data[2].should.eql(data[1]);
    return data;
  }).map(item => User.removeById(item._id)));

  it('sort() - descending', () => User.insert([
    {age: 15},
    {age: 35},
    {age: 10}
  ]).then(data => {
    const query = User.sort('age', -1);
    query.data[0].should.eql(data[1]);
    query.data[1].should.eql(data[0]);
    query.data[2].should.eql(data[2]);
    return data;
  }).map(item => User.removeById(item._id)));

  it('sort() - multi', () => User.insert([
    {age: 15, email: 'A'},
    {age: 30, email: 'B'},
    {age: 20, email: 'C'},
    {age: 20, email: 'D'}
  ]).then(data => {
    const query = User.sort('age email');
    query.data[0].should.eql(data[0]);
    query.data[1].should.eql(data[2]);
    query.data[2].should.eql(data[3]);
    query.data[3].should.eql(data[1]);
    return data;
  }).map(item => User.removeById(item._id)));

  it('eq()', () => Post.insert(Array(5).fill({})).then(data => {
    for (let i = 0, len = data.length; i < len; i++) {
      Post.eq(i).should.eql(data[i]);
    }

    return data;
  }).map(item => Post.removeById(item._id)));

  it('eq() - negative index', () => Post.insert(Array(5).fill({})).then(data => {
    for (let i = 1, len = data.length; i <= len; i++) {
      Post.eq(-i).should.eql(data[len - i]);
    }

    return data;
  }).map(item => Post.removeById(item._id)));

  it('first()', () => Post.insert(Array(5).fill({})).then(data => {
    Post.first().should.eql(data[0]);

    return data;
  }).map(item => Post.removeById(item._id)));

  it('last()', () => Post.insert(Array(5).fill({})).then(data => {
    Post.last().should.eql(data[data.length - 1]);

    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - no arguments', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice().data.should.eql(data);
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - one argument', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(2).data.should.eql(data.slice(2));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - one negative argument', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(-2).data.should.eql(data.slice(-2));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - two arguments', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(2, 4).data.should.eql(data.slice(2, 4));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - start + negative end index', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(1, -1).data.should.eql(data.slice(1, -1));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - two negative arguments', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(-3, -1).data.should.eql(data.slice(-3, -1));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - start > end', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(-1, -3).data.should.eql(data.slice(-1, -3));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - index overflow', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(1, 100).data.should.eql(data.slice(1, 100));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('slice() - index overflow 2', () => Post.insert(Array(5).fill({})).then(data => {
    Post.slice(100, 200).data.should.eql(data.slice(100, 200));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('limit()', () => Post.insert(Array(5).fill({})).then(data => {
    Post.limit(2).data.should.eql(data.slice(0, 2));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('skip()', () => Post.insert(Array(5).fill({})).then(data => {
    Post.skip(2).data.should.eql(data.slice(2));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('reverse()', () => Post.insert(Array(5).fill({})).then(data => {
    const query = Post.reverse();

    for (let i = 0, len = data.length; i < len; i++) {
      query.data[i].should.eql(data[len - i - 1]);
    }

    return data;
  }).map(item => Post.removeById(item._id)));

  it('shuffle()', () => Post.insert(Array(5).fill({})).then(data => {
    const query = Post.shuffle();
    sortBy(query.data, '_id').should.eql(sortBy(data, '_id'));
    return data;
  }).map(item => Post.removeById(item._id)));

  it('map()', () => Post.insert(Array(5).fill({})).then(data => {
    let num = 0;

    const d1 = Post.map((item, i) => {
      i.should.eql(num++);
      return item._id;
    });

    const d2 = data.map(item => item._id);

    d1.should.eql(d2);

    return data;
  }).map(item => Post.removeById(item._id)));

  it('reduce()', () => Post.insert([
    {email: 'A'},
    {email: 'B'},
    {email: 'C'}
  ]).then(data => {
    let num = 1;

    const sum = Post.reduce((sum, item, i) => {
      i.should.eql(num++);
      return {email: sum.email + item.email};
    });

    sum.email.should.eql('ABC');

    return data;
  }).map(item => Post.removeById(item._id)));

  it('reduce() - with initial', () => Post.insert([
    {email: 'A'},
    {email: 'B'},
    {email: 'C'}
  ]).then(data => {
    let num = 0;

    const sum = Post.reduce((sum, item, i) => {
      i.should.eql(num++);
      return sum + item.email;
    }, '_');

    sum.should.eql('_ABC');

    return data;
  }).map(item => Post.removeById(item._id)));

  it('reduceRight()', () => Post.insert([
    {email: 'A'},
    {email: 'B'},
    {email: 'C'}
  ]).then(data => {
    let num = 1;

    const sum = Post.reduceRight((sum, item, i) => {
      i.should.eql(num--);
      return {email: sum.email + item.email};
    });

    sum.email.should.eql('CBA');

    return data;
  }).map(item => Post.removeById(item._id)));

  it('reduceRight() - with initial', () => Post.insert([
    {email: 'A'},
    {email: 'B'},
    {email: 'C'}
  ]).then(data => {
    let num = 2;

    const sum = Post.reduceRight((sum, item, i) => {
      i.should.eql(num--);
      return sum + item.email;
    }, '_');

    sum.should.eql('_CBA');

    return data;
  }).map(item => Post.removeById(item._id)));

  it('filter()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let num = 0;

    const query = User.filter((data, i) => {
      i.should.eql(num++);
      return data.age > 20;
    });

    query.data.should.eql(data.slice(2));

    return data;
  }).map(item => User.removeById(item._id)));

  it('every()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let num = 0;

    User.every((data, i) => {
      i.should.eql(num++);
      return data.age;
    }).should.be.true;

    User.every((data, i) => data.age > 10).should.be.false;

    return data;
  }).map(item => User.removeById(item._id)));

  it('some()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let num = 0;

    User.some((data, i) => data.age > 10).should.be.true;

    User.some((data, i) => {
      i.should.eql(num++);
      return data.age < 0;
    }).should.be.false;

    return data;
  }).map(item => User.removeById(item._id)));

  it('populate() - object', () => {
    let user, post;

    return User.insert({}).then(user_ => {
      user = user_;

      return Post.insert({
        user_id: user_._id
      });
    }).then(post_ => {
      post = post_;
      return Post.populate('user_id');
    }).then(result => {
      result.first().user_id.should.eql(user);

      return Promise.all([
        User.removeById(user._id),
        Post.removeById(post._id)
      ]);
    });
  });

  it('populate() - array', () => {
    let posts, user;

    return Post.insert([
      {title: 'ABCD'},
      {title: 'ACD'},
      {title: 'CDE'},
      {title: 'XYZ'}
    ]).then(posts_ => {
      posts = posts_;

      return User.insert({
        posts: posts.map(post => post._id)
      });
    }).then(user_ => {
      user = user_;
      return User.populate('posts');
    }).then(result => {
      const query = result.first().posts;

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

  it('populate() - match', () => {
    let posts, user;

    return Post.insert([
      {title: 'ABCD'},
      {title: 'ACD'},
      {title: 'CDE'},
      {title: 'XYZ'}
    ]).then(posts_ => {
      posts = posts_;

      return User.insert({
        posts: posts.map(post => post._id)
      });
    }).then(user_ => {
      user = user_;
      return User.populate({
        path: 'posts',
        match: {title: /^A/}
      });
    }).then(result => {
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

  it('populate() - sort', () => {
    let posts, user;

    return Post.insert([
      {title: 'XYZ'},
      {title: 'ABCD'},
      {title: 'CDE'},
      {title: 'ACD'}
    ]).then(posts_ => {
      posts = posts_;

      return User.insert({
        posts: posts.map(post => post._id)
      });
    }).then(user_ => {
      user = user_;

      return User.populate({
        path: 'posts',
        sort: 'title'
      });
    }).then(result => {
      result.first().posts.toArray().should.eql([
        posts[1],
        posts[3],
        posts[2],
        posts[0]
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

  it('populate() - limit', () => {
    let posts, user;

    return Post.insert([
      {title: 'XYZ'},
      {title: 'ABCD'},
      {title: 'CDE'},
      {title: 'ACD'}
    ]).then(posts_ => {
      posts = posts_;

      return User.insert({
        posts: posts.map(post => post._id)
      });
    }).then(user_ => {
      user = user_;

      return User.populate({
        path: 'posts',
        limit: 2
      });
    }).then(result => {
      result.first().posts.toArray().should.eql(posts.slice(0, 2));

      // with match
      return User.populate({
        path: 'posts',
        match: {title: /D/},
        limit: 2
      });
    }).then(result => {
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

  it('populate() - skip', () => {
    let posts, user;

    return Post.insert([
      {title: 'XYZ'},
      {title: 'ABCD'},
      {title: 'CDE'},
      {title: 'ACD'}
    ]).then(posts_ => {
      posts = posts_;

      return User.insert({
        posts: posts.map(post => post._id)
      });
    }).then(user_ => {
      user = user_;

      return User.populate({
        path: 'posts',
        skip: 2
      });
    }).then(result => {
      result.first().posts.toArray().should.eql(posts.slice(2));

      // with match
      return User.populate({
        path: 'posts',
        match: {title: /D/},
        skip: 2
      });
    }).then(result => {
      result.first().posts.toArray().should.eql(posts.slice(3));

      // with limit
      return User.populate({
        path: 'posts',
        limit: 2,
        skip: 1
      });
    }).then(result => {
      result.first().posts.toArray().should.eql(posts.slice(1, 3));

      // with match & limit
      return User.populate({
        path: 'posts',
        match: {title: /D/},
        limit: 2,
        skip: 1
      });
    }).then(result => {
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

  it('static method', () => {
    const schema = new Schema();

    schema.static('add', function(value) {
      return this.insert(value);
    });

    const Test = db.model('Test', schema);

    Test.add({name: 'foo'}).then(data => {
      data.name.should.eql('foo');
    });

    Test.destroy();
  });

  it('instance method', () => {
    const schema = new Schema();

    schema.method('getName', function() {
      return this.name;
    });

    const Test = db.model('Test', schema);

    Test.insert({name: 'foo'}).then(data => {
      data.getName().should.eql('foo');
    });

    Test.destroy();
  });

  it('_import()', () => {
    const schema = new Schema({
      _id: {type: String, required: true},
      bool: Boolean
    });

    const Test = db.model('Test', schema);

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

  it('_export()', () => {
    const schema = new Schema({
      _id: {type: String, required: true},
      bool: Boolean
    });

    const Test = db.model('Test', schema);

    return Test.insert([
      {_id: 'A', bool: true},
      {_id: 'B', bool: false}
    ]).then(data => {
      Test._export().should.eql(JSON.stringify([
        {_id: 'A', bool: 1},
        {_id: 'B', bool: 0}
      ]));

      return Test.destroy();
    });
  });

  it('_export() - should not save undefined value', () => {
    class CacheType extends SchemaType {}

    CacheType.prototype.value = () => {};

    const schema = new Schema({
      cache: CacheType
    });

    const Test = db.model('Test', schema);

    return Test.insert({
      cache: 'test'
    }).then(data => {
      data.cache.should.exist;
      should.not.exist(JSON.parse(Test._export())[0].cache);

      return Test.destroy();
    });
  });
});
