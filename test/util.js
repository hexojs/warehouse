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
  it('copy()', function(){
    var arr = randomArr(),
      copy = util.copy(arr);

    arr.should.eql(copy);
  });

  it('reverse()', function(){
    var arr = randomArr(),
      reverse = util.reverse(arr);

    reverse.should.eql(arr.reverse());
  });

  it('shuffle()', function(){
    var arr = randomArr(),
      shuffle = util.shuffle(arr);

    shuffle.sort().should.eql(arr.sort());
  });

  it('unique()', function(){
    var arr = util.unique([1, 2, 2, 3, 4, 5, 5, 5, 6]);

    arr.should.eql([1, 2, 3, 4, 5, 6]);
  });

  it('flatten()', function(){
    var arr = util.flatten([1, 2, [3, [4], [5, [6]]]]);

    arr.should.eql([1, 2, 3, 4, 5, 6]);
  });

  it('sort()', function(){
    var arr = randomArr();

    var nativeSort = arr.sort(function(a, b){
      return a - b;
    });

    util.sort(arr).should.eql(nativeSort);
  });

  it('uid()', function(){
    util.uid(16).should.have.length(16);
  });

  it('compare()', function(){
    util.compare([1, 2, [3, 4]], [1, 2, [3, 2]]).should.be.false;
    util.compare([1, '2, 3'], [1, 2, 3]).should.be.false;
    util.compare([1, 2, [3, 4, [5]]], [1, 2, [3, 4, [5]]]).should.be.true;
  });

  it('getProperty()', function(){
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

  it('setProperty()', function(){
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

  it('deleteProperty()', function(){
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

  it('getType()', function(){
    // String
    util.getType('string').should.be.eql('String');
    util.getType('').should.be.eql('String');

    // Number
    util.getType(1).should.be.eql('Number');
    util.getType(0).should.be.eql('Number');

    // Array
    util.getType(['str']).should.be.eql('Array');
    util.getType([]).should.be.eql('Array');

    // Object
    util.getType({foo: 1, bar: 2}).should.be.eql('Object');
    util.getType({}).should.be.eql('Object');
    util.getType({length: 1}).should.be.eql('Object');

    // Boolean
    util.getType(true).should.be.eql('Boolean');
    util.getType(false).should.be.eql('Boolean');

    // Function
    util.getType(function(){}).should.be.eql('Function');

    // Date
    util.getType(new Date).should.be.eql('Date');

    // Null
    util.getType(null).should.be.eql('Null');

    // Undefined
    util.getType(undefined).should.be.eql('Undefined');
  });
});