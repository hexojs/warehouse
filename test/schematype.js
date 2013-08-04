var should = require('should'),
  SchemaType = require('../lib/schematype'),
  Types = require('../lib/types');

describe('SchemaType', function(){
  describe('Prototype', function(){
    var Type = SchemaType,
      type = new SchemaType(),
      q = Type.queryOperators;

    it('default value', function(){
      var type = new SchemaType({
        default: 'test'
      });

      type.default().should.eql('test');
    });

    it('default function', function(){
      var type = new SchemaType({
        default: function(){
          return 'test';
        }
      });

      type.default().should.eql('test');
    });

    it('required', function(){
      type.required.should.be.false;

      type = new SchemaType({
        required: true
      });

      type.required.should.be.true;
    });

    it('checkRequired()', function(){
      // array
      type.checkRequired(['foo']).should.be.true;
      type.checkRequired([]).should.be.true;

      // boolean
      type.checkRequired(true).should.be.true;
      type.checkRequired(false).should.be.true;

      // date
      type.checkRequired(new Date()).should.be.true;

      // number
      type.checkRequired(1).should.be.true;
      type.checkRequired(0).should.be.true;

      // object
      type.checkRequired({length: 1}).should.be.true;
      type.checkRequired({}).should.be.true;

      // string
      type.checkRequired('foo').should.be.true;
      type.checkRequired('').should.be.true;

      // undefined
      type.checkRequired(null).should.be.false;
      type.checkRequired(undefined).should.be.false;
    });

    it('compare()', function(){
      Type.compare(1, true).should.be.true;
      Type.compare(1, false).should.be.false;
      Type.compare(0, true).should.be.false;
      Type.compare(0, false).should.be.true;
      Type.compare('foo', 'foo').should.be.true;
      Type.compare(10, '10').should.be.true;
      Type.compare('foo', 'bar').should.be.false;
     });

    it('query - $exist', function(){
      // array
      q.exist(['foo'], true).should.be.true;
      q.exist([], true).should.be.true;
      q.exist(['foo'], false).should.be.false;
      q.exist([], false).should.be.false;

      // boolean
      q.exist(true, true).should.be.true;
      q.exist(false, true).should.be.true;
      q.exist(true, false).should.be.false;
      q.exist(false, false).should.be.false;

      // number
      q.exist(1, true).should.be.true;
      q.exist(0, true).should.be.true;
      q.exist(1, false).should.be.false;
      q.exist(0, false).should.be.false;

      // object
      q.exist({length: 1}, true).should.be.true;
      q.exist({}, true).should.be.true;
      q.exist({length: 1}, false).should.be.false;
      q.exist({}, false).should.be.false;

      // string
      q.exist('test', true).should.be.true;
      q.exist('', true).should.be.true;
      q.exist('test', false).should.be.false;
      q.exist('', false).should.be.false;

      // undefined
      q.exist(null, true).should.be.false;
      q.exist(undefined, true).should.be.false;
      q.exist(null, false).should.be.true;
      q.exist(undefined, false).should.be.true;
    });

    it('query - $ne', function(){
      q.ne(1, true).should.be.false;
      q.ne(1, false).should.be.true;
      q.ne(0, true).should.be.true;
      q.ne(0, false).should.be.false;
      q.ne('foo', 'foo').should.be.false;
      q.ne(10, '10').should.be.false;
      q.ne('foo', 'bar').should.be.true;
    });

    it('query - $lt', function(){
      q.lt(0, 1).should.be.true;
      q.lt(0, 0).should.be.false;
      q.lt(0, -1).should.be.false;
    });

    it('query - $lte', function(){
      q.lte(0, 1).should.be.true;
      q.lte(0, 0).should.be.true;
      q.lte(0, -1).should.be.false;
    });

    it('query - $gt', function(){
      q.gt(0, 1).should.be.false;
      q.gt(0, 0).should.be.false;
      q.gt(0, -1).should.be.true;
    });

    it('query - $gte', function(){
      q.gte(0, 1).should.be.false;
      q.gte(0, 0).should.be.true;
      q.gte(0, -1).should.be.true;
    });

    it('query - $in', function(){
      q.in(1, [1, 2]).should.be.true;
      q.in(1, [2, 3]).should.be.false;
    });

    it('query - $nin', function(){
      q.nin(1, [1, 2]).should.be.false;
      q.nin(1, [2, 3]).should.be.true;
    });

    it('query - $within', function(){
      q.within(1, [0, 2]).should.be.true;
      q.within(1, [1, 2]).should.be.true;
      q.within(1, [0, 1]).should.be.true;
      q.within(1, [2, 3]).should.be.false;
    });

    it('query - $without', function(){
      q.without(1, [0, 2]).should.be.false;
      q.without(1, [1, 2]).should.be.false;
      q.without(1, [0, 1]).should.be.false;
      q.without(1, [2, 3]).should.be.true;
    });

    it('query - $where', function(){
      q.where(1, function(data){
        return data > 1;
      }).should.be.false;

      q.where('test', function(data){
        return /\w+/.test(data);
      }).should.be.true;
    });
  });

  describe('Array', function(){
    var Type = Types.Array,
      type = new Type(),
      q = Type.queryOperators,
      u = Type.updateOperators;

    it('no default', function(){
      type.default().should.be.eql([]);
    });

    it('default value', function(){
      type = new Type({
        default: [1, 2, 3]
      });

      type.default().should.be.eql([1, 2, 3]);
    });

    it('default function', function(){
      type = new Type({
        default: function(){
          return [1, 2, 3]
        }
      });

      type.default().should.be.eql([1, 2, 3]);
    });

    it('checkRequired()', function(){
      // array
      type.checkRequired(['foo']).should.be.true;
      type.checkRequired([]).should.be.true;

      // boolean
      type.checkRequired(true).should.be.false;
      type.checkRequired(false).should.be.false;

      // date
      type.checkRequired(new Date()).should.be.false;

      // number
      type.checkRequired(1).should.be.false;
      type.checkRequired(0).should.be.false;

      // object
      type.checkRequired({length: 1}).should.be.false;
      type.checkRequired({}).should.be.false;

      // string
      type.checkRequired('foo').should.be.false;
      type.checkRequired('').should.be.false;

      // undefined
      type.checkRequired(null).should.be.false;
      type.checkRequired(undefined).should.be.false;
    });

    it('cast()', function(){
      type.cast('foo').should.eql(['foo']);
      type.cast(['foo', 'bar']).should.eql(['foo', 'bar']);
    });

    it('compare()', function(){
      Type.compare([1, 2, [3, 4]], [1, 2, [3, 2]]).should.be.false;
      Type.compare([1, '2, 3'], [1, 2, 3]).should.be.false;
      Type.compare([1, 2, [3, 4, [5]]], [1, 2, [3, 4, [5]]]).should.be.true;
    });

    it('query - $length', function(){
      var arr = ['foo', 'bar', 'baz'];

      q.length(arr, 3).should.be.true;
      q.length(arr, 2).should.be.false;
      q.length(arr, {$lt: 4}).should.be.true;
      q.length(arr, {$lte: 3}).should.be.true;
      q.length(arr, {$max: 2}).should.be.false;
      q.length(arr, {$gt: 1}).should.be.true;
      q.length(arr, {$gte: 3}).should.be.true;
      q.length(arr, {$min: 4}).should.be.false;
    });

    it('query - $in', function(){
      var arr = ['foo', 'bar', 'baz'];

      q.in(arr, 'foo').should.be.true;
      q.in(arr, ['foo', 'bar']).should.be.true;
      q.in(arr, ['foo', 'test']).should.be.true;
      q.in(arr, ['test', 'str']).should.be.false;
    });

    it('query - $nin', function(){
      var arr = ['foo', 'bar', 'baz'];

      q.nin(arr, 'str').should.be.true;
      q.nin(arr, ['str', 'test']).should.be.true;
      q.nin(arr, ['foo']).should.be.false;
      q.nin(arr, ['str', 'foo']).should.be.false;
    });

    it('query - $all', function(){
      var arr = ['foo', 'bar', 'baz'];

      q.all(arr, 'foo').should.be.true;
      q.all(arr, ['foo', 'bar']).should.be.true;
      q.all(arr, ['foo', 'test']).should.be.false;
      q.all(arr, ['test', 'str']).should.be.false;
    });

    it('update - $push', function(){
      var arr = [];

      u.push(arr, 'foo').should.eql(['foo']);
      u.push(arr, ['foo', 'bar']).should.eql(['foo', 'bar']);
    });

    it('update - $unshift', function(){
      var arr = [1, 2];

      u.unshift(arr, 'foo').should.eql(['foo', 1, 2]);
      u.unshift(arr, ['foo', 'bar']).should.eql(['foo', 'bar', 1, 2]);
    });

    it('update - $pull', function(){
      var arr = [1, 2, 3, 3, 4];

      u.pull(arr, 3).should.eql([1, 2, 4]);
      u.pull(arr, [1, 2]).should.eql([3, 3, 4]);
    });

    it('update - $shift', function(){
      var arr = [1, 2, 3, 4, 5];

      u.shift(arr, 1).should.eql([2, 3, 4, 5]);
      u.shift(arr, 2).should.eql([3, 4, 5]);
      u.shift(arr, -1).should.eql([1, 2, 3, 4]);
      u.shift(arr, -2).should.eql([1, 2, 3]);
    });

    it('update - $pop', function(){
      var arr = [1, 2, 3, 4, 5];

      u.pop(arr, 1).should.eql([1, 2, 3, 4]);
      u.pop(arr, 2).should.eql([1, 2, 3]);
      u.pop(arr, -1).should.eql([2, 3, 4, 5]);
      u.pop(arr, -2).should.eql([3, 4, 5]);
    });

    it('update - $addToSet', function(){
      var arr = [1, 2, 3];

      u.addToSet(arr, 4).should.eql([1, 2, 3, 4]);
      u.addToSet(arr, [4, 5]).should.eql([1, 2, 3, 4, 5]);
      u.addToSet(arr, [1, 4]).should.eql([1, 2, 3, 4]);
    });
  });

  describe('Boolean', function(){
    var Type = Types.Boolean,
      type = new Type();

    it('checkRequired()', function(){
      // array
      type.checkRequired(['foo']).should.be.false;
      type.checkRequired([]).should.be.false;

      // boolean
      type.checkRequired(true).should.be.true;
      type.checkRequired(false).should.be.true;

      // date
      type.checkRequired(new Date()).should.be.false;

      // number
      type.checkRequired(1).should.be.false;
      type.checkRequired(0).should.be.false;

      // object
      type.checkRequired({length: 1}).should.be.false;
      type.checkRequired({}).should.be.false;

      // string
      type.checkRequired('foo').should.be.false;
      type.checkRequired('').should.be.false;

      // undefined
      type.checkRequired(null).should.be.false;
      type.checkRequired(undefined).should.be.false;
    });

    it('cast()', function(){
      type.cast(0).should.be.false;
      type.cast(1).should.be.true;
      type.cast('0').should.be.false;
      type.cast('1').should.be.true;
      type.cast('true').should.be.true;
      type.cast('false').should.be.false;
      type.cast(true).should.be.true;
      type.cast(false).should.be.false;
    });
  });

  describe('Date', function(){
    var Type = Types.Date,
      type = new Type(),
      q = Type.queryOperators,
      u = Type.updateOperators;

    it('checkRequired()', function(){
      // array
      type.checkRequired(['foo']).should.be.false;
      type.checkRequired([]).should.be.false;

      // boolean
      type.checkRequired(true).should.be.false;
      type.checkRequired(false).should.be.false;

      // date
      type.checkRequired(new Date()).should.be.true;

      // number
      type.checkRequired(1).should.be.false;
      type.checkRequired(0).should.be.false;

      // object
      type.checkRequired({length: 1}).should.be.false;
      type.checkRequired({}).should.be.false;

      // string
      type.checkRequired('foo').should.be.false;
      type.checkRequired('').should.be.false;

      // undefined
      type.checkRequired(null).should.be.false;
      type.checkRequired(undefined).should.be.false;
    });

    it('cast()', function(){
      var date = new Date();

      type.cast(date).should.be.instanceof(Date);
      type.cast(date.toString()).should.be.instanceof(Date);
      type.cast(Date.now()).should.be.instanceof(Date);
      type.cast(Date.now().toString()).should.be.instanceof(Date);
      should.not.exist(type.cast('foo'));
    });

    it('save()', function(){
      var date = new Date();

      type.save(date).should.be.eql(date.valueOf());
    });

    it('compare()', function(){
      var now = Date.now();

      Type.compare(new Date(now), new Date(now)).should.be.true;
    });

    it('query - $year', function(){
      var date = new Date(2013, 0, 1);

      q.year(date, 2013).should.be.true;
      q.year(date, 2014).should.be.false;
    });

    it('query - $month', function(){
      var date = new Date(2013, 0, 1);

      q.month(date, 1).should.be.true;
      q.month(date, 2).should.be.false;
    });

    it('query - $day', function(){
      var date = new Date(2013, 0, 1);

      q.day(date, 1).should.be.true;
      q.day(date, 2).should.be.false;
    });

    it('query - $ne', function(){
      var date = new Date(2013, 0, 1);

      q.ne(date, date).should.be.false;
      q.ne(date, new Date(2013, 0, 2)).should.be.true;
    });

    it('update - $inc', function(){
      var date = new Date();

      u.inc(date, 1).valueOf().should.eql(date.valueOf() + 1);
    });

    it('update - $dec', function(){
      var date = new Date();

      u.dec(date, 1).valueOf().should.eql(date.valueOf() - 1);
    });
  });

  describe('Number', function(){
    var Type = Types.Number,
      type = new Type(),
      u = Type.updateOperators;

    it('checkRequired()', function(){
      // array
      type.checkRequired(['foo']).should.be.false;
      type.checkRequired([]).should.be.false;

      // boolean
      type.checkRequired(true).should.be.false;
      type.checkRequired(false).should.be.false;

      // date
      type.checkRequired(new Date()).should.be.false;

      // number
      type.checkRequired(1).should.be.true;
      type.checkRequired(0).should.be.true;

      // object
      type.checkRequired({length: 1}).should.be.false;
      type.checkRequired({}).should.be.false;

      // string
      type.checkRequired('foo').should.be.false;
      type.checkRequired('').should.be.false;

      // undefined
      type.checkRequired(null).should.be.false;
      type.checkRequired(undefined).should.be.false;
    });

    it('cast()', function(){
      type.cast(1).should.be.eql(1);
      type.cast(0).should.be.eql(0);
      type.cast('1').should.be.eql(1)
      type.cast('0').should.be.eql(0);
      should.not.exist(type.cast('foo'));
    });

    it('update - $inc', function(){
      u.inc(1, 2).should.be.eql(3);
    });

    it('update - $dec', function(){
      u.dec(1, 2).should.be.eql(-1);
    });
  });

  describe('Object', function(){
    var Type = Types.Object,
      type = new Type();

    it('no default', function(){
      type.default().should.be.eql({});
    });

    it('default value', function(){
      type = new Type({
        default: {
          foo: 1
        }
      });

      type.default().should.be.eql({foo: 1});
    });

    it('default function', function(){
      type = new Type({
        default: function(){
          return {foo: 1};
        }
      });

      type.default().should.be.eql({foo: 1});
    });

    it('compare()', function(){
      var obj = {
        foo: 1,
        bar: {
          baz: 2
        }
      };

      Type.compare(obj, obj).should.be.true;
    });
  });

  describe('String', function(){
    var Type = Types.String,
      type = new Type(),
      q = Type.queryOperators;

    it('checkRequired()', function(){
      // array
      type.checkRequired(['foo']).should.be.false;
      type.checkRequired([]).should.be.false;

      // boolean
      type.checkRequired(true).should.be.false;
      type.checkRequired(false).should.be.false;

      // date
      type.checkRequired(new Date()).should.be.false;

      // number
      type.checkRequired(1).should.be.false;
      type.checkRequired(0).should.be.false;

      // object
      type.checkRequired({length: 1}).should.be.false;
      type.checkRequired({}).should.be.false;

      // string
      type.checkRequired('foo').should.be.true;
      type.checkRequired('').should.be.true;

      // undefined
      type.checkRequired(null).should.be.false;
      type.checkRequired(undefined).should.be.false;
    });

    it('cast()', function(){
      type.cast('foo').should.be.eql('foo');
      type.cast('').should.be.eql('');
      type.cast(true).should.be.eql('true');
      type.cast(false).should.be.eql('false');
      type.cast(1).should.be.eql('1');
      type.cast(0).should.be.eql('0');
    });

    it('compare()', function(){
      Type.compare('123', /\d+/).should.be.true;
      Type.compare('123', '123').should.be.true;
      Type.compare('123', 'foo').should.be.false;
    });

    it('query - $ne', function(){
      q.ne('123', /\d+/).should.be.false;
      q.ne('123', '123').should.be.false;
      q.ne('123', 'foo').should.be.true;
    });
  });
});