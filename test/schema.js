var Schema = require('../lib/schema'),
  Types = require('../lib/types'),
  Virtual = require('../lib/virtual');

describe('Schema', function(){
  it('add()', function(){
    var schema = new Schema({
      string: String,
      str: {type: String},
      number: Number,
      bool: Boolean,
      date: Date,
      array: [Number, String],
      obj: {
        foo: {
          bar: Number
        },
        baz: String
      }
    });

    schema.tree._id.should.be.instanceof(Types.String);
    schema.tree.string.should.be.instanceof(Types.String);
    schema.tree.str.should.be.instanceof(Types.String);
    schema.tree.number.should.be.instanceof(Types.Number);
    schema.tree.bool.should.be.instanceof(Types.Boolean);
    schema.tree.date.should.be.instanceof(Types.Date);
    schema.tree.array.should.be.instanceof(Types.Array);
    schema.tree.obj.should.be.instanceof(Types.Object);
    schema.tree.array._nested[0].should.be.instanceof(Types.Number);
    schema.tree.array._nested[1].should.be.instanceof(Types.String);
    schema.tree.obj._nested.foo.should.be.instanceof(Types.Object);
    schema.tree.obj._nested.foo._nested.bar.should.be.instanceof(Types.Number);
    schema.tree.obj._nested.baz.should.be.instanceof(Types.String);
  });

  it('path()', function(){
    var schema = new Schema({
      name: String,
      obj: {
        foo: Number
      }
    });

    schema.path('name').should.be.instanceof(Types.String);
    schema.path('obj').should.be.instanceof(Types.Object);
    schema.path('obj.foo').should.be.instanceof(Types.Number);
  });

  it('virtual()', function(){
    var schema = new Schema();

    schema.virtual('str').should.be.instanceof(Virtual);
    schema.path('str').should.be.instanceof(Virtual);
  });

  it('pre()', function(){
    var schema = new Schema();

    (function(){
      schema.pre('save');
    }).should.throw('Schema hook must be a function!');

    (function(){
      schema.pre('save', 123);
    }).should.throw('Schema hook must be a function!');

    (function(){
      schema.pre('foo', function(){});
    }).should.throw('Schema hook type must be `save` or `remove`!');

    schema.pre('save', function(){});
    schema.pre('remove', function(){});

    schema.pres.save.length = 1;
    schema.pres.remove.length = 1;
  });

  it('post()', function(){
    var schema = new Schema();

    (function(){
      schema.post('save');
    }).should.throw('Schema hook must be a function!');

    (function(){
      schema.post('save', 123);
    }).should.throw('Schema hook must be a function!');

    (function(){
      schema.post('foo', function(){});
    }).should.throw('Schema hook type must be `save` or `remove`!');

    schema.post('save', function(){});
    schema.post('remove', function(){});

    schema.posts.save.length = 1;
    schema.posts.remove.length = 1;
  });

  it('method()', function(){
    var schema = new Schema();

    (function(){
      schema.method('name');
    }).should.throw('Schema method must be a function!');

    schema.method('name', function(){});

    schema.methods.name.should.be.a('function');
  });

  it('static()', function(){
    var schema = new Schema();

    (function(){
      schema.static('name');
    }).should.throw('Schema static must be a function!');

    schema.static('name', function(){});

    schema.statics.name.should.be.a('function');
  });

  it('default definition', function(){
    var schema = new Schema({
      string: {type: String, default: 'string'},
      number: {type: Number, default: 8},
      arr: {type: Array, default: [1, 2, 3]},
      arrFn: {type: Array, default: function(){ return [4, 5, 6] }}
    });

    schema.path('string').default().should.be.eql('string');
    schema.path('number').default().should.be.eql(8);
    schema.path('arr').default().should.be.eql([1, 2, 3]);
    schema.path('arrFn').default().should.be.eql([4, 5, 6]);
  });
});