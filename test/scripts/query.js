var should = require('chai').should();
var _ = require('lodash');
var Promise = require('bluebird');

describe('Query', function(){
  var Database = require('../..');
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

  it('count()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).count().should.eql(data.length);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('forEach()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var count = 0;

      User.find({}).forEach(function(item, i){
        item.should.eql(data[i]);
        i.should.eql(count++);
      });

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('toArray()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).toArray().should.eql(data);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('eq()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var query = User.find({});

      for (var i = 0, len = data.length; i < len; i++){
        query.eq(i).should.eql(data[i]);
      }

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('eq() - negative index', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var query = User.find({});

      for (var i = 1, len = data.length; i <= len; i++){
        query.eq(-i).should.eql(data[len - i]);
      }

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('first()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).first().should.eql(data[0]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('last()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).last().should.eql(data[data.length - 1]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('slice()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).slice(2, 4).data.should.eql(data.slice(2, 4));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('limit()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).limit(2).data.should.eql(data.slice(0, 2));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('skip()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).skip(2).data.should.eql(data.slice(2));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('reverse()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      User.find({}).reverse().data.should.eql(data.reverse());
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('shuffle()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      _.sortBy(User.find({}).shuffle().data, '_id').should.eql(_.sortBy(data, '_id'));
      return data;
    }).map(function(item){
      return User.removeById(item._id);
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
      var query = User.find({}).find({age: 20});
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
      var query = User.find({}).find({});
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
      var query = User.find({}).find({age: {$gt: 20}});
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
      var query = User.find({}).find({age: {$gte: 20}}, {limit: 2});
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
      var query = User.find({}).find({age: {$gte: 20}}, {skip: 1});
      query.data.should.eql(data.slice(2));

      // with limit
      query = User.find({}).find({age: {$gte: 20}}, {limit: 1, skip: 1});
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
      var query = User.find({}).find({age: {$gt: 20}}, {lean: true});
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
      User.find({}).findOne({age: {$gt: 20}}).should.eql(data[2]);
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
      User.find({}).findOne({age: {$gt: 20}}, {lean: true})._id.should.eql(data[2]._id);
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
      var query = User.find({}).sort('age');
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
      var query = User.find({}).sort('age', -1);
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
      {age: 15, name: 'A'},
      {age: 30, name: 'B'},
      {age: 20, name: 'C'},
      {age: 20, name: 'D'}
    ]).then(function(data){
      var query = User.find({}).sort('age name');
      query.data[0].should.eql(data[0]);
      query.data[1].should.eql(data[2]);
      query.data[2].should.eql(data[3]);
      query.data[3].should.eql(data[1]);
      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('map()', function(){
    return User.insert([
      {}, {}, {}, {}, {}
    ]).then(function(data){
      var num = 0;

      var d1 = User.find({}).map(function(item, i){
        i.should.eql(num++);
        return item._id;
      });

      var d2 = data.map(function(item){
        return item._id;
      });

      d1.should.eql(d2);

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('reduce()', function(){
    return User.insert([
      {name: 'A'},
      {name: 'B'},
      {name: 'C'}
    ]).then(function(data){
      var num = 1;

      var sum = User.find({}).reduce(function(sum, item, i){
        i.should.eql(num++);
        return {name: sum.name + item.name};
      });

      sum.name.should.eql('ABC');

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('reduce() - initial', function(){
    return User.insert([
      {name: 'A'},
      {name: 'B'},
      {name: 'C'}
    ]).then(function(data){
      var num = 0;

      var sum = User.find({}).reduce(function(sum, item, i){
        i.should.eql(num++);
        return sum + item.name;
      }, '_');

      sum.should.eql('_ABC');

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('reduceRight()', function(){
    return User.insert([
      {name: 'A'},
      {name: 'B'},
      {name: 'C'}
    ]).then(function(data){
      var num = 1;

      var sum = User.find({}).reduceRight(function(sum, item, i){
        i.should.eql(num--);
        return {name: sum.name + item.name};
      });

      sum.name.should.eql('CBA');

      return data;
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('reduceRight() - initial', function(){
    return User.insert([
      {name: 'A'},
      {name: 'B'},
      {name: 'C'}
    ]).then(function(data){
      var num = 2;

      var sum = User.find({}).reduceRight(function(sum, item, i){
        i.should.eql(num--);
        return sum + item.name;
      }, '_');

      sum.should.eql('_CBA');

      return data;
    }).map(function(item){
      return User.removeById(item._id);
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

      var query = User.find({}).filter(function(data, i){
        i.should.eql(num++);
        return data.age > 20;
      });

      query.data.should.eql(data.slice(2));

      return data;
    }).map(function(item){
      return User.removeById(item._id);
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
      return User.find({age: 20}).update({name: 'A'}).then(function(updated){
        updated[0]._id.should.eql(data[1]._id);
        updated[1]._id.should.eql(data[3]._id);
        updated[0].name.should.eql('A');
        updated[1].name.should.eql('A');
        return data;
      });
    }).map(function(item){
      return User.removeById(item._id);
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
      return User.find({age: 20}).replace({name: 'A'}).then(function(updated){
        updated[0]._id.should.eql(data[1]._id);
        updated[1]._id.should.eql(data[3]._id);
        updated[0].name.should.eql('A');
        updated[1].name.should.eql('A');
        return data;
      });
    }).map(function(item){
      return User.removeById(item._id);
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
      return User.find({age: 20}).remove().then(function(removed){
        should.not.exist(User.findById(data[1]._id));
        should.not.exist(User.findById(data[3]._id));
        return [data[0], data[2], data[4]];
      });
    }).map(function(item){
      return User.removeById(item._id);
    });
  });

  it('populate() - object', function(){
    var user, comment;

    return User.insert({}).then(function(user_){
      user = user_;

      return Comment.insert({
        author: user._id
      });
    }).then(function(comment_){
      comment = comment_;
      return Comment.find({}).populate('author');
    }).then(function(result){
      result.first().author.should.eql(user);

      return Promise.all([
        User.removeById(user._id),
        Comment.removeById(comment._id)
      ]);
    });
  });

  it('populate() - array', function(){
    var comments, user;

    return Comment.insert([
      {content: 'foo'},
      {content: 'bar'},
      {content: 'baz'},
      {content: 'ha'}
    ]).then(function(comments_){
      comments = comments_;

      return User.insert({
        comments: _.map(comments, '_id')
      });
    }).then(function(user_){
      user = user_;
      return User.populate('comments');
    }).then(function(result){
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
});