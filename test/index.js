var Database = require('../lib'),
  db = new Database();

var posts = db.model('posts', {
  title: String,
  layout: {type: String, default: 'post'},
  comments: [Number]
});

describe('Model', function(){
  var results = {
    1: {
      title: 'First',
      layout: 'post',
      comments: [],
      _id: 1
    },
    2: {
      title: 'First',
      layout: 'page',
      comments: [1, 2, 3],
      _id: 2
    },
    3: {
      title: 'Second',
      layout: 'post',
      comments: [],
      _id: 3
    },
    default: {
      title: '',
      layout: 'post',
      comments: []
    }
  };

  describe('insert()', function(){
    it('one object', function(done){
      var obj = {
        title: 'First'
      };

      posts.insert(obj, function(item, id){
        item.should.eql(results[1]);
        id.should.eql(1);
        done();
      });
    });

    it('an array including two objects', function(done){
      var arr = [
        {
          title: 'First',
          layout: 'page',
          comments: [1, '2', 3]
        },
        {
          title: 'Second'
        }
      ];

      posts.insert(arr, function(item){
        item[0].should.eql(results[2]);
        item[1].should.eql(results[3]);
        done();
      });
    });
  });

  describe('get()', function(){
    it('one item', function(){
      var item = posts.get(1);
      item.should.eql(results[1]);
    });

    it('an array', function(){
      var arr = posts.get([2, 3]);
      arr[0].should.eql(results[2]);
      arr[1].should.eql(results[3]);
    });

    it('two arguments', function(){
      var arr = posts.get(2, 3);
      arr[0].should.eql(results[2]);
      arr[1].should.eql(results[3]);
    });
  });

  describe('count()', function(){
    it('should equal 3', function(){
      posts.count().should.eql(3);
    });
  });

  describe('length', function(){
    it('should equal 3', function(){
      posts.length.should.eql(3);
    });
  });

  describe('toArray()', function(){
    it('should return an array including all items', function(){
      var arr = posts.toArray();
      for (var i=0, len=arr.length; i<len; i++){
        arr[i].should.eql(results[i + 1]);
      }
    });
  });

  describe('each()', function(){
    it('should iterate over all items', function(){
      posts.each(function(item, i){
        item.should.eql(results[i]);
      });
    });
  });

  describe('first()', function(){
    it('should return the first element', function(){
      var item = posts.first();
      item.should.eql(results[1]);
    });
  });

  describe('last()', function(){
    it('should return the last element', function(){
      var item = posts.last();
      item.should.eql(results[3]);
    });
  });

  describe('eq()', function(){
    it('should return the second element', function(){
      var item = posts.eq(1);
      item.should.eql(results[2]);
    });

    it('should return the last element', function(){
      var item = posts.eq(-1);
      item.should.eql(results[3]);
    });
  });

  describe('slice()', function(){
    it('should return the second element', function(){
      var item = posts.slice(1, 2);
      item._index.should.eql([2]);
    });

    it('should return the last element', function(){
      var item = posts.slice(-1);
      item._index.should.eql([3]);
    });
  });

  describe('limit()', function(){
    it('should return the first two elements', function(){
      var item = posts.limit(2);
      item._index.should.eql([1, 2]);
    });
  });

  describe('skip()', function(){
    it('should skip the first two elements', function(){
      var item = posts.skip(2);
      item._index.should.eql([3]);
    });
  });

  describe('random()', function(){
    it('should shuffle the model', function(){
      var item = posts.random();
      item._index.should.include(1);
      item._index.should.include(2);
      item._index.should.include(3);
    });
  });

  describe('sort()', function(){
    it('ascending', function(){
      var item = posts.sort('title');
      item._index.should.eql([1, 2, 3]);
    });

    it('descending', function(){
      var item = posts.sort('title', -1);
      item._index.should.eql([3, 2, 1]);
    });
  });

  describe('reverse()', function(){
    it('should return a reversed model', function(){
      var item = posts.reverse();
      item._index.should.eql([3, 2, 1]);
    });
  });

  describe('find()', function(){
    it('normal', function(){
      var item = posts.find({layout: 'post'});
      item._index.should.eql([1, 3]);
    });

    it('RegExp', function(){
      var item = posts.find({title: /first/i});
      item._index.should.eql([1, 2]);
    });

    it('$lt', function(){
      var item = posts.find({_id: {$lt: 2}});
      item._index.should.eql([1]);
    });

    it('$lte', function(){
      var item = posts.find({_id: {$lte: 2}});
      item._index.should.eql([1, 2]);
    });

    it('$gt', function(){
      var item = posts.find({_id: {$gt: 2}});
      item._index.should.eql([3]);
    });

    it('$gte', function(){
      var item = posts.find({_id: {$gte: 2}});
      item._index.should.eql([2, 3]);
    });

    it('$length', function(){
      var item = posts.find({comments: {$length: 3}});
      item._index.should.eql([2]);
    });

    it('$in', function(){
      var item = posts.find({comments: {$in: 1}});
      item._index.should.eql([2]);
    });

    it('$nin', function(){
      var item = posts.find({comments: {$nin: 1}});
      item._index.should.eql([1, 3]);
    });

    it('$all', function(){
      var item = posts.find({comments: {$all: [1, 2, 3]}});
      item._index.should.eql([2]);
    });

    it('$exists', function(){
      var item = posts.find({title: {$exists: false}});
      item._index.should.eql([]);
      var item = posts.find({title: {$exists: true}});
      item._index.should.eql([1, 2, 3]);
    });

    it('$ne', function(){
      var item = posts.find({title: {$ne: 'First'}});
      item._index.should.eql([3]);
    });
  });

  describe('replace()', function(){
    it('one item', function(){
      posts.replace(1, {});
      var item = posts.get(1);
      item.should.include(results.default);
    });

    it('all items', function(){
      posts.replace({});
      var item = posts.toArray();
      for (var i=0; i<3; i++){
        item[i].should.include(results.default);
      }
    });
  });

  describe('update()', function(){
    it('one item', function(){
      posts.update(1, {title: 'Third', number: 1});
      var item = posts.get(1);
      item.title.should.eql('Third');
      item.number.should.eql(1);
    });

    it('all items', function(){
      posts.update({ext: false});
      var arr = posts.toArray();
      for (var i=0; i<3; i++){
        arr[i].ext.should.be.false;
      }
    });

    it('$push', function(){
      posts.update(1, {comments: {$push: 1}});
      var item = posts.get(1);
      item.comments.should.eql([1]);
      posts.update(1, {comments: {$push: [2, 3]}});
      var item = posts.get(1);
      item.comments.should.eql([1, 2, 3]);
    });

    it('$pull', function(){
      posts.update(1, {comments: {$pull: 1}});
      var item = posts.get(1);
      item.comments.should.eql([2, 3]);
      posts.update(1, {comments: {$pull: [2, 3]}});
      var item = posts.get(1);
      item.comments.should.eql([]);
    });

    it('$shift', function(){
      posts.update(1, {comments: [1, 2]});
      posts.update(1, {comments: {$shift: 1}});
      var item = posts.get(1);
      item.comments.should.eql([2]);
      posts.update(1, {comments: {$shift: -1}});
      var item = posts.get(1);
      item.comments.should.eql([]);
    });

    it('$pop', function(){
      posts.update(1, {comments: [1, 2]});
      posts.update(1, {comments: {$pop: 1}});
      var item = posts.get(1);
      item.comments.should.eql([1]);
      posts.update(1, {comments: {$pop: -1}});
      var item = posts.get(1);
      item.comments.should.eql([]);
    });

    it('$inc', function(){
      posts.update(1, {num: 1});
      posts.update(1, {num: {$inc: 2}});
      var item = posts.get(1);
      item.num.should.eql(3);
      posts.update(1, {num: {$inc: -2}});
      var item = posts.get(1);
      item.num.should.eql(1);
    });

    it('$dec', function(){
      posts.update(1, {num: 1});
      posts.update(1, {num: {$dec: 2}});
      var item = posts.get(1);
      item.num.should.eql(-1);
      posts.update(1, {num: {$dec: -2}});
      var item = posts.get(1);
      item.num.should.eql(1);
    });
  });

  describe('remove()', function(){
    it('one item', function(){
      posts.remove(1);
      posts._index.should.eql([2, 3]);
      (typeof posts.get(1)).should.eql('undefined');
    });

    it('an array', function(){
      posts.remove([2, 3]);
      posts._index.should.eql([]);
      (typeof posts.get(2)).should.eql('undefined');
      (typeof posts.get(3)).should.eql('undefined');
    });

    it('multiple arguments', function(){
      posts.insert([{}, {}]);
      posts.remove(4, 5);
      posts._index.should.eql([]);
      (typeof posts.get(4)).should.eql('undefined');
      (typeof posts.get(5)).should.eql('undefined');
    });

    it('all items', function(){
      posts.insert([{}, {}, {}]);
      posts.remove();
      posts._index.should.eql([]);
      (typeof posts.get(6)).should.eql('undefined');
      (typeof posts.get(7)).should.eql('undefined');
      (typeof posts.get(8)).should.eql('undefined');
    });
  });
});

describe('Store', function(){
  var obj = {foo: 1, bar: 2},
    store = new db.Store(obj);

  describe('list()', function(){
    it('should return all elements', function(){
      var list = store.list();
      list.should.eql(obj);
    });
  });

  describe('get()', function(){
    it('should return the specific element', function(){
      var item = store.get('foo');
      item.should.eql(1);
    });
  });

  describe('set()', function(){
    it('should update the specific element', function(){
      store.set('foo', 4);
      var item = store.get('foo');
      item.should.eql(4);
    });

    it('should insert a new element', function(){
      store.set('test', 'test');
      var item = store.get('test');
      item.should.eql('test');
    });
  });

  describe('remove()', function(){
    it('should remove the specific element', function(){
      store.remove('test');
      var item = store.get('test');
      (typeof item).should.eql('undefined');
    });
  })
});