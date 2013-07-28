var Database = module.exports = require('./lib');

var database = new Database();
var Post = database.model('Post', {
  string: String,
  array: [Number],
  number: Number,
  object: {foo: String, bar: Number},
  bool: Boolean,
  date: Date
});

var post = Post.new({
  string: 1,
  array: [1, '2', 3],
  number: '4',
  bool: false
});
//console.log(Post)
post.save(function(doc){
  console.log(doc)
  //console.log(Post)
});

//console.log(Post.new({}));

//console.log(post.new({foo: 1, bar: 2}))