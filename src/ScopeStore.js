

function ScopeStore(engine) {
  this._engine = engine;
  this._scope = {};
  this._counter = 0;
}

ScopeStore.prototype.setScope = function(scope) {
  this._scope = scope || {};
};

ScopeStore.prototype.idProperty = 'id';

ScopeStore.prototype.query = function(query, options) {
  if (query.root) {
    return [{id: this._uniqId(), name: 'root', hasChildren: true}];
  }
};

// summary:
//    Retrieves the children of an object.
// parent: Object
//    The object to find the children of.
// options: dojo/store/api/Store.QueryOptions?
//    Additional options to apply to the retrieval of the children.
// returns: dojo/store/api/Store.QueryResults
//    A result set of the children of the parent object.
ScopeStore.prototype.getChildren = function(parent, options){
  var that = this;
  if (parent.name === 'root') {
    var ret = [];

    if (this._scope.this != null) {
        ret.push({
        name: "this", 
        hasChildren: true, 
        id: this._uniqId(), 
        children: this._scope.this
      });
    }

    _.each(this._scope.locals, function(val, key) {
      ret.push({name: key+'\t'+val, id: that._uniqId(), children: val, hasChildren: _.keys(val).length != 0});
    });

    return ret;
  } else {
    var cObj = parent.children;
    return _.map(_.keys(cObj), function(cname) {
      var val = cObj[cname];
      return {name: cname+'\t'+val, id: that._uniqId(), children: val, hasChildren: _.keys(val).length != 0};
    });
  }
};

ScopeStore.prototype._uniqId = function() {
  return this._counter++;
};

// summary:
//    Returns an object's identity
// object: Object
//    The object to get the identity from
// returns: String|Number
ScopeStore.prototype.getIdentity = function(object){
  return object[this.idProperty];
};
