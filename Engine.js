'use strict';

var Engine = (function() {

/*
  function scopify(expr) {
    return new Function('$scope', 'with($scope){ return '+expr+';}');
  }

  function parseInstr(sm, instr) {

  }

  function StateMachine() {
    this.pc = 0;
    this.stack = [];
    this.scopes = [];
  }

  StateMachine.prototype.reset = function() {
    StateMachine.call(this);
  };

  StateMachine.prototype.push = function(value) {
    this.stack.push(value);
  };

  StateMachine.prototype.pop = function() {
    return this.stack.splice(this.stack.length - 1, 1);
  };*/

  function fn_nop() {}
  function fn_invalid() {
    throw new Error('Invalid instruction');
  }

  function Engine() {
    // this._sm = new StateMachine();
  }

  function Instruction(code, fn) {
    this._code = code;
    this._fn = fn;
  }

  Instruction.prototype.toString = function() {
    return this._code;
  };

  Engine.prototype.load = function(program) {

    var _prog = this._prog = [];

    _prog.push(new Instruction('# --- main ---', fn_invalid));
    _prog.push(new Instruction('', fn_invalid));

    _.each(program.main.code, function(instr) {
      _prog.push(new Instruction('\t'+instr, fn_invalid));
    });

    _.each(program.classes, function(cd, cname) {
      _prog.push(new Instruction('', fn_invalid));
      _prog.push(new Instruction('# --- class '+cname.replace(/\n/g, ' ')+' ---', fn_invalid));

      _.each(cd.meth, function(md, mname) {
        _prog.push(new Instruction('', fn_invalid));
        _prog.push(new Instruction('# '+mname.replace(/\n/g, ' '), fn_invalid));
        _prog.push(new Instruction('', fn_invalid));

        _.each(md.code, function(instr) {
          _prog.push(new Instruction('\t'+instr, fn_invalid));
        });
      });
    });
  };

  Engine.prototype.getProgramAsText = function() {
    return this._prog.map(function(instr) {
      return instr.toString();
    }).join('\n');
  };


  return Engine;

}());