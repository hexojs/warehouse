var should = require('chai').should();

describe('model', function(){
  var Database = require('../..'),
    Schema = Database.Schema;

  var userSchema = new Schema({
    name: {
      first: String,
      last: String,
    },
    email: String,
    age: Number
  });
});