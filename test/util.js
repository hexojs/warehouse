var should = require('should'),
  util = require('../lib/util');

var randomArr = function(){
  var result = [];

  for (var i = 0; i < 100; i++){
    result.push(parseInt(Math.random() * 100));
  }

  return result;
};

describe('Utilities', function(){
  describe('copy()', function(){
    it('copies an array', function(){
      var arr = randomArr(),
        copy = util.copy(arr);

      arr.should.eql(copy);
    });
  });

  describe('reverse()', function(){
    it('reverses an array', function(){
      var arr = randomArr(),
        reverse = util.reverse(arr);

      reverse.should.eql(arr.reverse());
    });
  });

  describe('shuffle()', function(){
    it('shuffles an array', function(){
      var arr = randomArr(),
        shuffle = util.shuffle(arr);

      shuffle.sort().should.eql(arr.sort());
    });
  });

  describe('unique()', function(){
    it('creates a duplicate-free copy of an array', function(){
      var arr = util.unique([1, 2, 2, 3, 4, 5, 5, 5, 6]);

      arr.should.eql([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('flatten()', function(){
    it('flattens an array', function(){
      var arr = util.flatten([1, 2, [3, [4], [5, [6]]]]);

      arr.should.eql([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('sort()', function(){
    it('sorts an array', function(){
      var arr = randomArr();

      var nativeSort = arr.sort(function(a, b){
        return a - b;
      });

      util.sort(arr).should.eql(nativeSort);
    });
  });

  describe('uid()', function(){
    it('generates a unique id', function(){
      util.uid(16).should.have.length(16);
    });
  });

  describe('getProperty()', function(){
    it('gets a property from an object', function(){
      var obj = {
        foo : {
          bar: 1,
          baz: {
            test: 2
          }
        }
      };

      util.getProperty(obj, 'foo.bar').should.eql(1);
      util.getProperty(obj, 'foo[baz].test').should.eql(2);
    });
  });

  describe('setProperty()', function(){
    it('sets a property in an object', function(){
      var obj = {
        foo: 1,
        baz: {
          test: 2
        }
      };

      util.setProperty(obj, 'baz.test', 3);
      obj.baz.test.should.eql(3);

      util.setProperty(obj, 'str[0]', 4);
      obj.str[0].should.eql(4);
    });
  });

  describe('deleteProperty()', function(){
    it('removes a property from an object', function(){
      var obj = {
        foo: 1,
        bar: {
          baz: {
            test: 2
          }
        }
      };

      util.deleteProperty(obj, 'bar.baz.test');
      should.not.exist(obj.bar.baz.test);

      util.deleteProperty(obj, 'bar[baz]');
      should.not.exist(obj.bar.baz);
    });
  });
});