var Database = module.exports = require('./lib');
var Schema = Database.Schema;
var Virtual = require('./lib/virtual');
var db = new Database();
var schema = new Schema({
  name: {
    first: String,
    last: String
  },
  email: String,
  age: Number,
  comments: [String],
  created: Date
});

schema.static('findLatest', function(){
  return this.sort({created: -1}).limit(3);
});

schema.method('fullName', function(){
  return this.name.first + ' ' + this.name.last;
});

schema.virtual('name.full').get(function(){
  return this.name.first + ' ' + this.name.last;
}).set(function(name){
  var split = name.split(' ');

  this.name = {
    first: split[0],
    last: split[1]
  };
});


//console.log(schema.path('name.full').type === Virtual)

//console.log(schema.tree.name._nested.full.type === Virtual)

var Post = db.model('Post', schema);
/*
Post.insert({
  name: {
    first: 'John',
    last: 'Doe',
    //full: 'John Doe',
    other: 'HA'
  },
  email: 'abc@abc.com',
  age: 30
}, function(data){
  console.log(data);
});*/

Post.insert({
  age: 30
});

var query = Post._createQuery();

query.each(function(item){
  console.log(item)
})