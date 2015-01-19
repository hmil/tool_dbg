function BreakpointsStore() {
  this._counter = 0;
  this._breakpoints = {};
}

BreakpointsStore.prototype.idProperty = 'id';

BreakpointsStore.prototype.query = function(query, options) {
  if (query.root) {
    console.log(this._breakpoints);
    var n = _(this._breakpoints).isEmpty() ? ' (none)' : '';
    return [{id: this._uniqId(), name: '<b>Breakpoints'+n+'</b>', isBreakpoint: true, hasChildren: true}];
  }
};

BreakpointsStore.prototype.setBreakpoints = function(breakpoints) {
  breakpoints = breakpoints.slice(0).sort(function(a, b) { return a - b; }); // clone array

  for(var i in breakpoints) {
    var line = breakpoints[i];
    if(this._breakpoints[line]) {
      this._breakpoints[line].active = true;
    }
    else {
      this._breakpoints[line] = {active: true, line: line};
    }
  }

  // disable all breakpoints that are not here anymore
  var removed = _(this._breakpoints).filter(function(obj) {
    return breakpoints.indexOf(obj.line) < 0;
  })
  for(var i in removed) {
    var line = removed[i].line;
    this._breakpoints[line].active = false;
  }
};

BreakpointsStore.prototype.removeBreakpoint = function(line) {
  delete this._breakpoints[line];
}
BreakpointsStore.prototype.enable = function(line) {
  this._breakpoints[line].active = true;
}

BreakpointsStore.prototype.disable = function(line) {
  this._breakpoints[line].active = false;  
};
BreakpointsStore.prototype.getChildren = function(parent, options){
	var that = this
	return _(this._breakpoints).map(function (obj) {
      var status = obj.active ? 'enabled' : 'disabled';
			return {
				name:"<span class='breakpoint'><span class='status-"+status+"'></span><span class='desc'>Line "+(obj.line + 1)+"</span></span>",
				hasChildren: false, 
				isBreakpoint: true, 
        line: obj.line
			}
		}
  )
};

BreakpointsStore.prototype._uniqId = function() {
  return this._counter++;
};


BreakpointsStore.prototype.getIdentity = function(object){
  return object[this.idProperty];
};
