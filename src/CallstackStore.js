function CallstackStore(engine) {
  this._engine = engine;
  this._callstack = [];
  this._counter = 0;
}

CallstackStore.prototype.setCallstack = function(callstack) {
  this._callstack = callstack || [];
};

CallstackStore.prototype.idProperty = 'id';

CallstackStore.prototype.query = function(query, options) {
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
CallstackStore.prototype.getChildren = function(parent, options){
	var that = this
	return _(this._callstack).map(function (call, i) {
		var id = that._uniqId();
		if(i == 0) {
			return {
				name:"Main function", 
				hasChildren: false, 
				line: call.line,
				id: id
			}
		}
		return {
			name: call['this'].cname+"."+call.mname+" (line "+(1+call.line)+")",
			hasChildren: false, 
			scope: call,
			line: call.line,
			id: id
		}
	})
  /*var that = this;
  if (parent.name === 'root') {
    var ret = [];

    if (this._scope.this != null) {
      ret.push({
        name: "this",
        value: "Object",
        labelType: "html",
        hasChildren: true, 
        id: this._uniqId(), 
        children: this._scope.this
      });
    }

    _.each(this._scope.locals, function(val, key) {
      ret.push({name: key, value: makeValueLabel(val), id: that._uniqId(), children: formatValue(val), hasChildren: _.keys(val).length != 0});
    });

    return ret;
  } else {
    var cObj = parent.children;
    return _.map(_.keys(cObj), function(cname) {
      var val = cObj[cname];
      return {name: cname, value: makeValueLabel(val), id: that._uniqId(), children: formatValue(val), hasChildren: _.keys(val).length != 0};
    });
  }*/
};

CallstackStore.prototype._uniqId = function() {
  return this._counter++;
};

// summary:
//    Returns an object's identity
// object: Object
//    The object to get the identity from
// returns: String|Number
CallstackStore.prototype.getIdentity = function(object){
  return object[this.idProperty];
};
