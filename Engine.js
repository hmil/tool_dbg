'use strict';

var Engine = window.Engine = (function() {

  function StateMachine() {
    this.pc = 2; // Skips the initial comments. First instr executed is 2
    this.stack = [];
    this.scopes = [{locals:{}}];
    this.hasEnded = false;
  }


  StateMachine.prototype.reset = function() {
    StateMachine.call(this);
  };

  StateMachine.prototype.push = function(value) {
    this.stack.push(value);
  };

  StateMachine.prototype.pop = function() {
    return this.stack.splice(this.stack.length - 1, 1)[0];
  };

  StateMachine.prototype.top = function() {
    return this.stack[this.stack.length - 1];
  };

  StateMachine.prototype.getCurrentScope = function() {
    return this.scopes[this.scopes.length - 1];
  };

  // Returns the value of a local or a parameter
  StateMachine.prototype.getLocalValue = function(identifier) {
    var scope = this.getCurrentScope();
    var from = [scope.locals || {}, scope.params || {}];
    for(var i in from) {
      var value = from[i][identifier];
      if (typeof value !== 'undefined') {
        return value;
      }
    }
    log.error("Unknown identifier "+identifier)
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
  function fn_print(sm) {
    log.info(JSON.parse(sm.pop()))
  }


  function Instruction(code, fn) {
    this._code = code;
    this.exec = fn;
  }

  Instruction.prototype.toString = function() {
    return this._code;
  };

  /* INSTRUCTIONS DEFINITION */

  // label x
  function Label(name) {
    Instruction.call(this, name + ':', fn_nop);
    this.isLabel = true;
    this.name = name;
  }
  _.extend(Label.prototype, Instruction.prototype);

  // const x
  function Instr_Const(value) {
    var intVal = parseInt(value);
    if (!_.isNaN(intVal)) value = intVal;
    Instruction.call(this, '\tpush '+value, function(sm) {
      sm.push(value);
    });
  }
  _.extend(Instr_Const.prototype, Instruction.prototype);

  // load x
  function Instr_Load(identifier) {
    Instruction.call(this, "\tload "+identifier, function(sm) {
      sm.push(sm.getLocalValue(identifier))
    });
  }
  _.extend(Instr_Load.prototype, Instruction.prototype)

  // store x
  function Instr_Store(identifier) {
    Instruction.call(this, "\tstore "+identifier, function(sm) {
      sm.getCurrentScope().locals[identifier] = sm.pop();
    })
  }
  _.extend(Instr_Store.prototype, Instruction.prototype)

  // dup
  function Instr_Dup() {
    Instruction.call(this, "\tdup", function(sm) {
      sm.push(sm.top());
    })
  }
  _.extend(Instr_Dup.prototype, Instruction.prototype)

  // not
  function Instr_Not() {
    Instruction.call(this, "\tnot", function(sm) {
      sm.push(1 - sm.pop());
    })
  }

  _.extend(Instr_Not.prototype, Instruction.prototype)

  // jz
  function Instr_JumpIfZero(label, invert) {
    invert = invert || false
    var n = "";
    if(invert) n = "n";
    Instruction.call(this, "\tj"+n+"z "+label, function(sm, prog) {
      console.log(prog)
      var value = sm.pop();
      if(!invert && value == 1 || invert && value == 0) {
        return;
      }
      sm.pc = prog.labels[label];
    })
  }

  _.extend(Instr_JumpIfZero.prototype, Instruction.prototype)

  // goto
  function Instr_Goto(label) {
    Instruction.call(this, "\tgoto"+label, function(sm, prog) {
      sm.pc = prog.labels[label];
    });
  }
  _.extend(Instr_Goto.prototype, Instruction.prototype)


  // add, sub, mul, div
  function Instr_BaseBinaryOperation(op) {
    Instruction.call(this, "\t"+op, function(sm) {
      var second = parseInt(sm.pop());
      var first = parseInt(sm.pop());
      var result;
      switch(op) {
        case 'add':
          result = first + second;
          break;
        case 'sub':
          result = first - second;
          break;
        case 'div':
          result = Math.floor(first / second);
          break;
        case 'mul':
          result = first * second;
          break;
        case 'and':
          result = first & second;
          break;
        case 'or':
          result = first | second;
          break;
      }
      sm.push(result);
    })
  }
  _.extend(Instr_BaseBinaryOperation.prototype, Instruction.prototype)

  function Instr_BaseBinaryComparison(op) {
    Instruction.call(this, "\t"+op, function(sm) {
      var second = parseInt(sm.pop());
      var first = parseInt(sm.pop());
      var result;
      switch(op) {
        case 'lt':
          result = first < second;
          break;
        case 'le':
          result = first <= second;
          break;
        case 'gt':
          result = first > second;
          break;
        case 'ge':
          result = first >= second;
          break;
      }
      sm.push(result ? 1 : 0);
    });
  }



  function createInstr(text) {
    var split = text.indexOf(' ');
    var op = (split > 0) ? text.substr(0, split) : text;
    var args = text.substr(1 + split);

    switch (op) {
      case 'label':
        return new Label(text.substr(split + 1));
      case 'ret':
        return new Instruction('\tret', fn_ret);
      case 'stat':
        return new Instruction('\t'+text, fn_nop);
      case 'const':
        return new Instr_Const(text.substr(split + 1));
      case 'println':
        return new Instruction('\tprintln', fn_print);
      case 'load':
        return new Instr_Load(args);
      case 'store':
        return new Instr_Store(args);
      case 'new':
        return new Instr_New(args);
      case 'invoke':
        return new Invoke_Instr(args);
      case 'dup':
        return new Instr_Dup();
      case 'not':
        return new Instr_Not();
      case 'add':
      case 'mul':
      case 'sub':
      case 'div':
      case 'and':
      case 'or':
        return new Instr_BaseBinaryOperation(op)
      case 'lt':
      case 'le':
      case 'gt':
      case 'ge':
        return new Instr_BaseBinaryComparison(op);
      case 'jz':
        return new Instr_JumpIfZero(args);
      case 'jnz':
        return new Instr_JumpIfZero(args, true /* invert */);
      case 'goto':
        return new Instr_Goto(args);

      default:
        return new Instruction('\t#' + text, fn_nop);
    }
  }


  function factory() {

    var sm = new StateMachine();

    var prog = [];
    var labels = {};

    var breakpoints = [];

    function Engine() {
      this.sm = sm;
      this.prog = prog;
    }

    function parseInstr(instr) {
      var parsed = createInstr(instr);

      if (parsed.isLabel) {
        prog.push(new Instruction('', fn_nop));
        labels[parsed.name] = prog.length;
      }
      prog.push(parsed);
    }

    Engine.prototype.getLabels = function() { return labels };

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

        _.each(cd.methods, function(md, mname) {
          prog.push(new Instruction('', fn_invalid));
          prog.push(new Instruction('# ' + mname.replace(/\n/g, ' '), fn_invalid));
          prog.push(new Instruction('', fn_invalid));

          _.each(md.code, parseInstr);
        });
      });

      breakpoints = new Array(prog.length);
      prog.labels = labels;
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
      prog[sm.pc].exec(sm, prog);
      console.log("Stack after "+prog[sm.pc]._code.substring(1)+": \n--> ["+sm.stack.join(", ")+"]")
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

    // State dump
    Engine.prototype.getStack = function() {
      return [];
    };

    Engine.prototype.getObjectByRef = function(objRef) {
      
    };

    Engine.prototype.getCallStack = function() {
      
    };

    Engine.prototype.getCurrentScope = function() {
      
    };




    return new Engine();
  }


  return {
    create: factory
  };

}());