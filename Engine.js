'use strict';

var Engine = (function() {

  function StateMachine() {
    this.pc = 2; // Skips the initial comments. First instr executed is 2
    this.stack = [];
    this.scopes = [];
    this.hasEnded = false;
  }

  StateMachine.prototype.reset = function() {
    StateMachine.call(this);
  };

  StateMachine.prototype.push = function(value) {
    this.stack.push(value);
  };

  StateMachine.prototype.pop = function() {
    return this.stack.splice(this.stack.length - 1, 1);
  };

  function fn_nop() {}

  function fn_invalid() {
    throw new Error('Invalid instruction');
  }
  function fn_exit(sm) {
    sm.hasEnded = true;
  }
  function fn_ret(sm) {
    sm.scopes.pop();
    if (sm.scopes.length === 0) {
      sm.hasEnded = true;
    }
  }


  function Instruction(code, fn) {
    this._code = code;
    this.exec = fn;
  }

  Instruction.prototype.toString = function() {
    return this._code;
  };


  function Label(name) {
    Instruction.call(this, name + ':', fn_nop);
    this.isLabel = true;
    this.name = name;
  }
  _.extend(Label.prototype, Instruction.prototype);

  function Instr_Const(value) {
    var intVal = parseInt(value);
    if (!_.isNaN(intVal)) value = intVal;
    Instruction.call(this, '\tpush '+value, function(sm) {
      sm.push(value);
    });
  }
  _.extend(Instr_Const.prototype, Instruction.prototype);


  function createInstr(text) {
    var split = text.indexOf(' ');
    var op = (split > 0) ? text.substr(0, split) : text;

    switch (op) {
      case 'label':
        return new Label(text.substr(split + 1));
      case 'ret':
        return new Instruction('\tret', fn_ret);
      case 'stat':
        return new Instruction('\t'+text, fn_nop);
      case 'const':
        return new Instr_Const(text.substr(split + 1));
      default:
        return new Instruction('\t#' + text, fn_nop);
    }
  }


  function factory() {

    var sm = new StateMachine();

    var prog = [];
    var labels = {};

    var breakpoints = [];

    function Engine() {}

    function parseInstr(instr) {
      var parsed = createInstr(instr);

      if (parsed.isLabel) {
        prog.push(new Instruction('', fn_nop));
        labels[parsed.name] = prog.length;
      }
      prog.push(parsed);
    }



    // Program loading, printing

    Engine.prototype.load = function(program) {

      this.reset();

      prog.push(new Instruction('# --- main ---', fn_invalid));
      prog.push(new Instruction('', fn_invalid));

      // main
      _.each(program.main.code, parseInstr);

      // classes
      _.each(program.classes, function(cd, cname) {
        prog.push(new Instruction('', fn_invalid));
        prog.push(new Instruction('# --- class ' + cname.replace(/\n/g, ' ') + ' ---', fn_invalid));

        _.each(cd.meth, function(md, mname) {
          prog.push(new Instruction('', fn_invalid));
          prog.push(new Instruction('# ' + mname.replace(/\n/g, ' '), fn_invalid));
          prog.push(new Instruction('', fn_invalid));

          _.each(md.code, parseInstr);
        });
      });

      breakpoints = new Array(prog.length);
    };

    Engine.prototype.reset = function() {
      prog.length = 0;
      labels = {};
      breakpoints.length = 0;
      sm.reset();
    };

    Engine.prototype.getProgramAsText = function() {
      return prog.map(function(instr) {
        return instr.toString();
      }).join('\n');
    };


    // Execution control

    Engine.prototype.run = function() {
      while (this.isRunning()) {
        this.tick();
        if (breakpoints[this.getNextASMLine()]) break;
      }
    };

    Engine.prototype.stepOver = function() {
      
    };

    Engine.prototype.stepInto = function() {
      
    };

    Engine.prototype.stepOut = function() {
      
    };

    Engine.prototype.stop = function() {

    };

    Engine.prototype.tick = function() {
      prog[sm.pc].exec(sm);
      ++sm.pc;
    };

    Engine.prototype.isRunning = function() {
      return !sm.hasEnded;
    };


    // Source-level debug (tool)

    Engine.prototype.getNextLine = function() {
      return 0;
    };

    Engine.prototype.setBreakpoint = function(line) {
      
    };

    Engine.prototype.removeBreakpoint = function(line) {

    };
    

    Engine.prototype.hasBreakpoint = function(line) {
      return false
    };

    Engine.prototype.isBreakable = function(line) {
      return false;
    };


    // ASM-level debug

    Engine.prototype.getNextASMLine = function() {
      return sm.pc;
    };

    Engine.prototype.setASMBreakpoint = function(instr) {
      console.log("setting br at "+instr);
      breakpoints[instr] = true;
    };

    Engine.prototype.removeASMBreakpoint = function(instr) {
      console.log("deleting br at "+instr);
      breakpoints[instr] = false;
    };

    Engine.prototype.hasASMBreakpoint = function(instr) {
      return breakpoints[instr];
    };

    Engine.prototype.isASMBreakable = function(instr) {
      return true;
    };




    return new Engine();
  }


  return {
    create: factory
  };

}());