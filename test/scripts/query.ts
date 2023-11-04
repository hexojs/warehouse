import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import lodash from 'lodash';
const { sortBy } = lodash;
import Promise from 'bluebird';
import Document from '../../dist/document';
import Database from '../../dist/database';
import type Query from '../../dist/query';

describe('Query', () => {

  const db = new Database();
  const Schema = Database.Schema;

  const User = db.model('User', {
    name: String,
    age: Number,
    comments: [{type: Schema.Types.CUID, ref: 'Comment'}]
  });

  const Loop = db.model('Loop', {
    age: {
      age: Number
    }
  });

  const Comment = db.model('Comment', {
    content: String,
    author: {type: Schema.Types.CUID, ref: 'User'}
  });

  it('count()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).count().should.eql(data.length);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('forEach()', () => User.insert(Array(5).fill({})).then(data => {
    let count = 0;

    User.find({}).forEach((item, i) => {
      item.should.eql(data[i]);
      i.should.eql(count++);
    });

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('toArray()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).toArray().should.eql(data);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('eq()', () => User.insert(Array(5).fill({})).then(data => {
    const query = User.find({});

    for (let i = 0, len = data.length; i < len; i++) {
      (query as Query).eq(i).should.eql(data[i]);
    }

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('eq() - negative index', () => User.insert(Array(5).fill({})).then(data => {
    const query = User.find({});

    for (let i = 1, len = data.length; i <= len; i++) {
      (query as Query).eq(-i).should.eql(data[len - i]);
    }

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('first()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).first().should.eql(data[0]);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('last()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).last().should.eql(data[data.length - 1]);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('slice()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).slice(2, 4).data.should.eql(data.slice(2, 4));
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('limit()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).limit(2).data.should.eql(data.slice(0, 2));
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('skip()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).skip(2).data.should.eql(data.slice(2));
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('reverse()', () => User.insert(Array(5).fill({})).then(data => {
    (User.find({}) as Query).reverse().data.should.eql(data.reverse());
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('shuffle()', () => User.insert(Array(5).fill({})).then(data => {
    sortBy((User.find({}) as Query).shuffle().data, '_id').should.eql(sortBy(data, '_id'));
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = (User.find({}) as Query).find({age: 20}) as Query;
    query.data.should.eql(data.slice(1, 3));

    const { length } = query;

    for (let i = 0; i < length; i++) {
      query.data[i].should.to.be.an.instanceof(Document);
    }
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - blank', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = (User.find({}) as Query).find({}) as Query;
    query.data.should.eql(data);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - operator', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = (User.find({}) as Query).find({age: {$gt: 20}}) as Query;
    query.data.should.eql(data.slice(2));
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - limit', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = (User.find({}) as Query).find({age: {$gte: 20}}, {limit: 2}) as Query;
    query.data.should.eql(data.slice(1, 3));
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - skip', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let query = (User.find({}) as Query).find({age: {$gte: 20}}, {skip: 1}) as Query;
    query.data.should.eql(data.slice(2));

    // with limit
    query = (User.find({}) as Query).find({age: {$gte: 20}}, {limit: 1, skip: 1}) as Query;
    query.data.should.eql(data.slice(2, 3));

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - lean', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const query = (User.find({}) as Query).find({age: {$gt: 20}}, {lean: true}) as Query;
    query.should.be.a('array');
    const { length } = query;
    for (let i = 0; i < length; i++) {
      query[i].should.to.not.be.an.instanceof(Document);
    }
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - $and', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $and: [
        {name: 'John'},
        {age: {$gt: 20}}
      ]
    }) as Query;

    query.toArray().should.eql([data[1]]);

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - $or', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $or: [
        {name: 'Jack'},
        {age: {$gt: 20}}
      ]
    }) as Query;

    query.toArray().should.eql(data.slice(1));

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - $nor', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $nor: [
        {name: 'Jack'},
        {age: {$gt: 20}}
      ]
    }) as Query;

    query.toArray().should.eql([data[0]]);

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - $not', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $not: {name: 'John'}
    }) as Query;

    query.toArray().should.eql([data[2]]);

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - $where', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $where() {
        return this.name === 'John';
      }
    }) as Query;

    query.toArray().should.eql(data.slice(0, 2));

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - abnormal - 1', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $and: [
        {name: 'Jack'},
        {age: {gt: 20}}
      ]
    }) as Query;
    query.toArray().length.should.eql(0);

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('find() - abnormal - 2', () => User.insert([
    {name: 'John', age: 20},
    {name: 'John', age: 25},
    {name: 'Jack', age: 30}
  ]).then(data => {
    const query = (User.find({}) as Query).find({
      $and: [
        {name: 'Jack'},
        {age: {gt: {}}}
      ]
    }) as Query;
    query.toArray().should.eql([data[2]]);

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('findOne()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const result = (User.find({}) as Query).findOne({age: {$gt: 20}});
    result.should.eql(data[2]);
    result.should.to.be.an.instanceof(Document);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('findOne() - lean', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    const result = (User.find({}) as Query).findOne({age: {$gt: 20}}, {lean: true});
    result._id.should.eql(data[2]._id);
    result.should.to.not.be.an.instanceof(Document);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('sort()', () => User.insert([
    {age: 15},
    {age: 35},
    {age: 10}
  ]).then(data => {
    const query = (User.find({}) as Query).sort('age');
    query.data[0].should.eql(data[2]);
    query.data[1].should.eql(data[0]);
    query.data[2].should.eql(data[1]);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('sort() - object', () => Loop.insert([
    {age: {age: 15}},
    {age: {age: 35}},
    {age: {age: 10}}
  ]).then(data => {
    const query = (Loop.find({}) as Query).sort('age', { age: 1 });
    query.data[0].should.eql(data[2]);
    query.data[1].should.eql(data[0]);
    query.data[2].should.eql(data[1]);
    return data;
  }).map<unknown, any>(item => Loop.removeById(item._id)));

  it('sort() - descending', () => User.insert([
    {age: 15},
    {age: 35},
    {age: 10}
  ]).then(data => {
    const query = (User.find({}) as Query).sort('age', -1);
    query.data[0].should.eql(data[1]);
    query.data[1].should.eql(data[0]);
    query.data[2].should.eql(data[2]);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('sort() - multi', () => User.insert([
    {age: 15, name: 'A'},
    {age: 30, name: 'B'},
    {age: 20, name: 'C'},
    {age: 20, name: 'D'}
  ]).then(data => {
    const query = (User.find({}) as Query).sort('age name');
    query.data[0].should.eql(data[0]);
    query.data[1].should.eql(data[2]);
    query.data[2].should.eql(data[3]);
    query.data[3].should.eql(data[1]);
    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('map()', () => User.insert(Array(5).fill({})).then(data => {
    let num = 0;

    const d1 = User.find({}).map((item, i) => {
      i.should.eql(num++);
      return item._id;
    });

    const d2 = data.map(item => item._id);

    d1.should.eql(d2);

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('reduce()', () => User.insert([
    {name: 'A'},
    {name: 'B'},
    {name: 'C'}
  ]).then(data => {
    let num = 1;

    const sum = User.find({}).reduce((sum, item, i) => {
      i.should.eql(num++);
      return {name: sum.name + item.name};
    });

    sum.name.should.eql('ABC');

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('reduce() - initial', () => User.insert([
    {name: 'A'},
    {name: 'B'},
    {name: 'C'}
  ]).then(data => {
    let num = 0;

    const sum = User.find({}).reduce((sum, item, i) => {
      i.should.eql(num++);
      return sum + item.name;
    }, '_');

    sum.should.eql('_ABC');

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('reduceRight()', () => User.insert([
    {name: 'A'},
    {name: 'B'},
    {name: 'C'}
  ]).then(data => {
    let num = 1;

    const sum = User.find({}).reduceRight((sum, item, i) => {
      i.should.eql(num--);
      return {name: sum.name + item.name};
    });

    sum.name.should.eql('CBA');

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('reduceRight() - initial', () => User.insert([
    {name: 'A'},
    {name: 'B'},
    {name: 'C'}
  ]).then(data => {
    let num = 2;

    const sum = User.find({}).reduceRight((sum, item, i) => {
      i.should.eql(num--);
      return sum + item.name;
    }, '_');

    sum.should.eql('_CBA');

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('filter()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let num = 0;

    const query = User.find({}).filter((data, i) => {
      i.should.eql(num++);
      return data.age > 20;
    }) as Query;

    query.data.should.eql(data.slice(2));

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('every()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let num = 0;

    User.find({}).every((data, i) => {
      i.should.eql(num++);
      return data.age;
    }).should.be.true;

    User.find({}).every((data, i) => data.age > 10).should.be.false;

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('some()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 40}
  ]).then(data => {
    let num = 0;

    User.find({}).some((data, i) => data.age > 10).should.be.true;

    User.find({}).some((data, i) => {
      i.should.eql(num++);
      return data.age < 0;
    }).should.be.false;

    return data;
  }).map<unknown, any>(item => User.removeById(item._id)));

  it('update()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 20},
    {age: 40}
  ]).then(data => (User.find({age: 20}) as Query).update({name: 'A'}).then(updated => {
    updated[0]._id.should.eql(data[1]._id);
    updated[1]._id.should.eql(data[3]._id);
    updated[0].name.should.eql('A');
    updated[1].name.should.eql('A');
    return data;
  })).map<unknown, any>(item => User.removeById(item._id)));

  it('replace()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 20},
    {age: 40}
  ]).then(data => (User.find({age: 20}) as Query).replace({name: 'A'}).then(updated => {
    updated[0]._id.should.eql(data[1]._id);
    updated[1]._id.should.eql(data[3]._id);
    updated[0].name.should.eql('A');
    updated[1].name.should.eql('A');
    return data;
  })).map<unknown, any>(item => User.removeById(item._id)));

  it('remove()', () => User.insert([
    {age: 10},
    {age: 20},
    {age: 30},
    {age: 20},
    {age: 40}
  ]).then(data => (User.find({age: 20}) as Query).remove().then(removed => {
    should.not.exist(User.findById(data[1]._id));
    should.not.exist(User.findById(data[3]._id));
    return [data[0], data[2], data[4]];
  })).map<unknown, any>(item => User.removeById(item._id)));

  it('populate() - object', () => {
    let user, comment;

    return User.insert({}).then(user_ => {
      user = user_;

      return Comment.insert({
        author: user._id
      });
    }).then(comment_ => {
      comment = comment_;
      return (Comment.find({}) as Query).populate('author');
    }).then(result => {
      result.first().author.should.eql(user);

      return Promise.all([
        User.removeById(user._id),
        Comment.removeById(comment._id)
      ]);
    });
  });

  it('populate() - array', () => {
    let comments, user;

    return Comment.insert([
      {content: 'foo'},
      {content: 'bar'},
      {content: 'baz'},
      {content: 'ha'}
    ]).then(comments_ => {
      comments = comments_;

      return User.insert({
        comments: comments.map(item => item._id)
      });
    }).then(user_ => {
      user = user_;
      return User.populate('comments');
    }).then(result => {
      result.first().comments.toArray().should.eql(comments);

      return Promise.all([
        User.removeById(user._id),
        Comment.removeById(comments[0]._id),
        Comment.removeById(comments[1]._id),
        Comment.removeById(comments[2]._id),
        Comment.removeById(comments[3]._id)
      ]);
    });
  });

  it('populate() - array expr - string', () => {
    let user, comment;

    return User.insert({}).then(user_ => {
      user = user_;

      return Comment.insert({
        author: user._id
      });
    }).then(comment_ => {
      comment = comment_;
      return (Comment.find({}) as Query).populate(['author']);
    }).then(result => {
      result.first().author.should.eql(user);

      return Promise.all([
        User.removeById(user._id),
        Comment.removeById(comment._id)
      ]);
    });
  });

  it('populate() - array expr - object', () => {
    let user, comment;

    return User.insert({}).then(user_ => {
      user = user_;

      return Comment.insert({
        author: user._id
      });
    }).then(comment_ => {
      comment = comment_;
      return (Comment.find({}) as Query).populate([{ path: 'author' }]);
    }).then(result => {
      result.first().author.should.eql(user);

      return Promise.all([
        User.removeById(user._id),
        Comment.removeById(comment._id)
      ]);
    });
  });

  it('populate() - path is required', () => {
    try {
      (Comment.find({}) as Query).populate({});
    } catch (err) {
      err.message.should.eql('path is required');
    }
  });
});
