import chai from 'chai';
const should = chai.should(); // eslint-disable-line
import Database from '../../dist/database';

describe('Schema', () => {
  const Schema = Database.Schema;

  it('add()', () => {
    const schema = new Schema();

    schema.add({
      str1: String,
      str2: {type: String},
      num1: Number,
      num2: {type: Number},
      bool1: Boolean,
      bool2: {type: Boolean},
      date1: Date,
      date2: {type: Date},
      arr1: [],
      arr2: [String],
      arr3: [{type: String}],
      obj1: Object,
      obj2: {
        foo: String,
        bar: {
          baz: {type: Number}
        }
      },
      id: {type: Schema.Types.CUID, required: true}
    });

    // string
    schema.paths.str1.should.be.an.instanceOf(Schema.Types.String);
    schema.paths.str2.should.be.an.instanceOf(Schema.Types.String);

    // number
    schema.paths.num1.should.be.an.instanceOf(Schema.Types.Number);
    schema.paths.num2.should.be.an.instanceOf(Schema.Types.Number);

    // boolean
    schema.paths.bool1.should.be.an.instanceOf(Schema.Types.Boolean);
    schema.paths.bool2.should.be.an.instanceOf(Schema.Types.Boolean);

    // date
    schema.paths.date1.should.be.an.instanceOf(Schema.Types.Date);
    schema.paths.date2.should.be.an.instanceOf(Schema.Types.Date);

    // array
    schema.paths.arr1.should.be.an.instanceOf(Schema.Types.Array);
    // @ts-ignore
    schema.paths.arr1.child.should.be.an.instanceOf(Schema.Types.Mixed);
    schema.paths.arr2.should.be.an.instanceOf(Schema.Types.Array);
    // @ts-ignore
    schema.paths.arr2.child.should.be.an.instanceOf(Schema.Types.String);
    schema.paths.arr3.should.be.an.instanceOf(Schema.Types.Array);
    // @ts-ignore
    schema.paths.arr3.child.should.be.an.instanceOf(Schema.Types.String);

    // object
    schema.paths.obj1.should.be.an.instanceOf(Schema.Types.Object);
    schema.paths.obj2.should.be.an.instanceOf(Schema.Types.Object);
    schema.paths['obj2.foo'].should.be.an.instanceOf(Schema.Types.String);
    schema.paths['obj2.bar'].should.be.an.instanceOf(Schema.Types.Object);
    schema.paths['obj2.bar.baz'].should.be.an.instanceOf(Schema.Types.Number);

    // id
    schema.paths.id.should.be.an.instanceOf(Schema.Types.CUID);
    schema.paths.id.options.required.should.be.true;
  });

  it('virtual() - without getter', () => {
    const schema = new Schema();

    schema.virtual('test');
    schema.paths.test.should.be.an.instanceOf(Schema.Types.Virtual);
  });

  it('virtual() - with getter', () => {
    const schema = new Schema();

    schema.virtual('test', () => {});

    schema.paths.test.should.be
      .an.instanceOf(Schema.Types.Virtual)
      .have.property('getter');
  });

  it('pre()', () => {
    const schema = new Schema();

    // save
    schema.pre('save', () => {});

    schema.hooks.pre.save.should.have.length(1);

    // remove
    schema.pre('remove', () => {});

    schema.hooks.pre.remove.should.have.length(1);

    // incompatible type
    (() => schema.pre('wtf', () => {})).should.to.throw(TypeError, 'Hook type must be `save` or `remove`!');

    // hook is not a function
    // @ts-ignore
    (() => schema.pre('save', {})).should.to.throw(TypeError, 'Hook must be a function!');
  });

  it('post()', () => {
    const schema = new Schema();

    // save
    schema.post('save', () => {});

    schema.hooks.post.save.should.have.length(1);

    // remove
    schema.post('remove', () => {});

    schema.hooks.post.remove.should.have.length(1);

    // incompatible type
    (() => schema.post('wtf', () => {})).should.throw(TypeError, 'Hook type must be `save` or `remove`!');

    // hook is not a function
    // @ts-ignore
    (() => schema.post('save', {})).should.to.throw(TypeError, 'Hook must be a function!');
  });

  it('method()', () => {
    const schema = new Schema();

    schema.method('test', () => {});

    schema.methods.test.should.exist;

    // without name
    schema.method.should.to.throw(TypeError, 'Method name is required!');

    // without function
    // @ts-ignore
    (() => schema.method('wtf', {})).should.to.throw(TypeError, 'Instance method must be a function!');
  });

  it('static()', () => {
    const schema = new Schema();

    schema.static('test', () => {});

    schema.statics.test.should.exist;

    // without name
    schema.static.should.to.throw(TypeError, 'Method name is required!');

    // without function
    // @ts-ignore
    (() => schema.static('wtf', {})).should.to.throw(TypeError, 'Static method must be a function!');
  });
});
