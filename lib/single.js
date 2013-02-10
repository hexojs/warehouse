module.exports = function(obj, parent){
  var fn = obj.__proto__,
    _this = this;

  fn.prev = function(){
    var index = parent._index,
      pos = index.indexOf(_this._id);
    return pos == 0 ? undefined : parent._getOne(index[pos - 1]);
  };

  fn.next = function(){
    var index = parent._index,
      pos = index.indexOf(_this._id);
    return pos == parent.length ? undefined : parent._getOne(index[pos + 1]);
  };

  fn.update = function(data){
    parent._updateOne(id, data);
  };

  fn.remove = function(){
    parent._removeOne(id);
  };

  return obj;
};