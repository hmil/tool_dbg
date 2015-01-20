'use strict';

var Engine = (function() {

  function newOfType(type) {
    switch (type.charAt(0)) {
      case 'S':
        return '';
      case 'I':
      case 'B':
        return 0;
      case '[':
        return [];
      case 'L':
        return null;
      default:
        throw new Error('Unknown type: '+type);
    }
  }

  function StateMachine() {
    this.pc = 2; // Skips the initial comments. First instr executed is 2
    this.curLine = 0;
    this.stack = [];
    this.scopes = [{}];
    this.hasEnded = false;
  }


  StateMachine.prototype.reset = function() {
    StateMachine.call(this);
  };

  StateMachine.prototype.push = function(value) {
    if (_.isNumber(value)) {
      this.stack.push(~~value);
    } else {
      this.stack.push(value);
    }
  };

  StateMachine.prototype.pop = function() {
    var pos = this.stack.length - 1;
    if (pos < 0) throw new Error("Stack is empty");
    return this.stack.splice(pos, 1)[0];
  };

  StateMachine.prototype.peek = function() {
    return this.stack[this.stack.length - 1];
  };

  StateMachine.prototype.setNextLine = function(line) {
    this.curLine = line;
  };

  StateMachine.prototype.getNextLine = function() {
    return this.curLine;
  };

  StateMachine.prototype.newScope = function(instance, methodName) {
    var method = instance._methods[methodName]

    this.scopes.push({
      this: instance,
      mname: methodName,
      line: parseInt(method.code[0].split(" ")[1]), // line at which the method begins
      locals: {},
      ret_addr: this.pc,
      ret_line: this.curLine
    });
  };

  StateMachine.prototype.popScope = function() {
    this.scopes.pop();
    if (this.scopes.length === 0) {
      this.hasEnded = true;
    }
  };

  StateMachine.prototype.currentScope = function() {
    return this.scopes[this.scopes.length - 1];
  };

  StateMachine.prototype.setLocal = function(name, value) {
    this.currentScope().locals[name] = value;
  };

  StateMachine.prototype.getLocal = function(name) {
    return this.currentScope().locals[name];
  };


  function fn_exit(sm) {
    sm.hasEnded = true;
  }
  function fn_ret(sm) {
    sm.pc = sm.currentScope().ret_addr;
    sm.curLine = sm.currentScope().ret_line;
    sm.popScope();
  }
  function fn_sub(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push(a - b);
  }
  function fn_add(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push(a + b);
  }
  function fn_mul(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push(a * b);
  }
  function fn_div(sm) {
    var b = sm.pop();
    if (b === 0) {
      sm.push(b);
      throw new Error("Divide by 0");
    }
    var a = sm.pop();
    var result = a / b;
    if (result < 0) {
      sm.push(Math.ceil(result));
    } else {
      sm.push(Math.floor(result));
    }
  }
  function fn_gt(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push((a > b) ? 1 : 0);
  }
  function fn_lt(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push((a < b) ? 1 : 0);
  }
  function fn_ge(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push((a >= b) ? 1 : 0);
  }
  function fn_le(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push((a <= b) ? 1 : 0);
  }
  function fn_eq(sm) {
    var b = sm.pop();
    var a = sm.pop();
    sm.push((a === b) ? 1 : 0);
  }
  function fn_aget(sm) {
    var id = sm.pop();
    var ref = sm.pop();
    sm.push(ref[id]);
  }
  function fn_aput(sm) {
    var val = sm.pop();
    var id = sm.pop();
    var ref = sm.pop();
    ref[id] = val;
  }
  function fn_newArray(sm) {
    sm.push(new Array(sm.pop()));
  }
  function fn_not(sm) {    sm.push(sm.pop() ? 0 : 1);  }
  function fn_this(sm) {   sm.push(sm.currentScope().this);  }
  function fn_length(sm) { sm.push(sm.pop().length); }
  function fn_dup(sm) {    sm.push(sm.peek());  }
  function fn_pop(sm) {    sm.pop();  }
  function fn_print(sm) {  log.info(sm.pop());  }
  function fn_nop() {}
  function fn_invalid() {    throw new Error('Invalid instruction'); }


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
    var parsed = JSON.parse(value);
    Instruction.call(this, '\tpush '+value, function(sm) {
      sm.push(parsed);
    });
  }
  _.extend(Instr_Const.prototype, Instruction.prototype);

  function Instr_Goto(label) {
    this.isJump = true;
    this.label = label;
    this._code = '\tgoto '+label;
  }
  _.extend(Instr_Goto.prototype, Instruction.prototype);
  Instr_Goto.prototype.setOffset = function(offset) {
    this.exec = function(sm) {
      sm.pc += offset;
    };
  };

  function Instr_JumpZero(label) {
    Instr_Goto.call(this, label);
    this._code = '\tjz '+label;
  }
  _.extend(Instr_JumpZero.prototype, Instr_Goto.prototype);
  Instr_JumpZero.prototype.setOffset = function(offset) {
    this.exec = function(sm) {
      if (sm.pop() === 0) {
        sm.pc += offset;
      }
    };
  };

  function Instr_JumpNonZero(label) {
    Instr_Goto.call(this, label);
    this._code = '\tjnz '+label;
  }
  _.extend(Instr_JumpNonZero.prototype, Instr_Goto.prototype);
  Instr_JumpNonZero.prototype.setOffset = function(offset) {
    this.exec = function(sm) {
      if (sm.pop() !== 0) {
        sm.pc += offset;
      }
    };
  };

  function Instr_Stat(line) {
    Instruction.call(this, 'l:'+line, function(sm) {
      sm.setNextLine(line - 1);
    });
  }
  _.extend(Instr_Stat.prototype, Instruction.prototype);

  function Instr_Lload(id) {
    Instruction.call(this, '\tlload '+id, function(sm) {
      sm.push(sm.getLocal(id));
    });
  }
  _.extend(Instr_Lload.prototype, Instruction.prototype);

  function Instr_Lstore(id) {
    Instruction.call(this, '\tlstore '+id, function(sm) {
      sm.setLocal(id, sm.pop());
    });
  }
  _.extend(Instr_Lstore.prototype, Instruction.prototype);

  function Instr_Fload(id) {
    Instruction.call(this, '\tfload '+id, function(sm) {
      sm.push(sm.currentScope().this[id]);
    });
  }
  _.extend(Instr_Fload.prototype, Instruction.prototype);

  function Instr_Fstore(id) {
    Instruction.call(this, '\tfstore '+id, function(sm) {
      sm.currentScope().this[id] = sm.pop();
    });
  }
  _.extend(Instr_Fstore.prototype, Instruction.prototype);

  function Instr_Invoke(mname) {
    Instruction.call(this, '\tinvoke '+mname, function(sm) {
      var obj = sm.pop();
      sm.newScope(obj, mname);
      var method = obj._methods[mname];
      sm.pc = method.addr - 1;
      _.each(method.args, function(p) {
        sm.setLocal(p.name, sm.pop());
      });
      _.each(method.vars, function(l, name) {
        sm.setLocal(name, newOfType(l));
      });
    });
  }
  _.extend(Instr_Invoke.prototype, Instruction.prototype);

  function factory() {

    var sm = new StateMachine();

    var prog = [];
    var labels = {};
    var jumps = [];
    var breakpoints = [];
    var breakpointsList = [];
    var breakpointsListeners = [];
    var classes = {};


    function Instr_New(className) {
      Instruction.call(this, '\tnew '+className, function(sm) {
        sm.push(new classes[className]);
      });
    }
    _.extend(Instr_New.prototype, Instruction.prototype);



    function createInstr(text) {
      var split = text.indexOf(' ');
      var op = (split > 0) ? text.substr(0, split) : text;

      switch (op) {
        case 'label':
          return new Label(text.substr(split + 1));
        case 'ret':
          return new Instruction('\tret', fn_ret);
        case 'stat':
          return new Instr_Stat(parseInt(text.substr(split + 1)));
        case 'sub':
          return new Instruction('\t'+text, fn_sub);
        case 'add':
          return new Instruction('\t'+text, fn_add);
        case 'div':
          return new Instruction('\t'+text, fn_div);
        case 'mul':
          return new Instruction('\t'+text, fn_mul);
        case 'gt':
          return new Instruction('\t'+text, fn_gt);
        case 'ge':
          return new Instruction('\t'+text, fn_ge);
        case 'lt':
          return new Instruction('\t'+text, fn_lt);
        case 'eq':
          return new Instruction('\t'+text, fn_eq);
        case 'le':
          return new Instruction('\t'+text, fn_le);
        case 'not':
          return new Instruction('\t'+text, fn_not);
        case 'length':
          return new Instruction('\t'+text, fn_length);
        case 'dup':
          return new Instruction('\t'+text, fn_dup);
        case 'pop':
          return new Instruction('\t'+text, fn_pop);
        case 'println':
          return new Instruction('\t'+text, fn_print);
        case 'aput':
          return new Instruction('\t'+text, fn_aput);
        case 'aget':
          return new Instruction('\t'+text, fn_aget);
        case 'jz':
          return new Instr_JumpZero(text.substr(split + 1));
        case 'jnz':
          return new Instr_JumpNonZero(text.substr(split + 1));
        case 'goto':
          return new Instr_Goto(text.substr(split + 1));
        case 'const':
          return new Instr_Const(text.substr(split + 1));
        case 'new':
          return new Instr_New(text.substr(split + 1));
        case 'newarray':
          return new Instruction('\tnewarray', fn_newArray);
        case 'invoke':
          return new Instr_Invoke(text.substr(split + 1));
        case 'this':
          return new Instruction('\tthis', fn_this);
        case 'lload':
          return new Instr_Lload(text.substr(split + 1));
        case 'lstore':
          return new Instr_Lstore(text.substr(split + 1));
        case 'fload':
          return new Instr_Fload(text.substr(split + 1));
        case 'fstore':
          return new Instr_Fstore(text.substr(split + 1));
        default:
          return new Instruction('\t#' + text, fn_invalid);
      }
    }

    function Engine() {
      this._prog = prog;
      this._sm = sm;
      this.breakpointsListeners = []
    }

    function parseInstr(instr) {
      var parsed = createInstr(instr);

      if (parsed.isLabel) {
        prog.push(new Instruction('', fn_nop));
        labels[parsed.name] = prog.length;
      } else if (parsed.isJump) {
        parsed.offset = prog.length;
        jumps.push(parsed);
      }
      prog.push(parsed);
    }

    function makeClass(cd, cname) {
      function Class() {
        var that = this;
        _.each(cd.fields, function(f, fname) {
          that[fname] = newOfType(f);
        });
      };

      Class.prototype.cname = cname;
      Class.prototype._methods = {};

      _.each(cd.methods, function(md, mname) {
        prog.push(new Instruction('', fn_invalid));
        prog.push(new Instruction('# ' + mname.replace(/\n/g, ' '), fn_invalid));
        prog.push(new Instruction('', fn_invalid));

        Class.prototype._methods[mname] = md;
        md.addr = prog.length;

        _.each(md.code, parseInstr);
      });

      return Class;
    }



    // Program loading, printing

    Engine.prototype.load = function(program) {

      sm.reset();
      prog.length = 0;
      labels = {};
      breakpoints.length = 0;

      prog.push(new Instruction('# --- main ---', fn_invalid));
      prog.push(new Instruction('', fn_invalid));

      // main
      _.each(program.main.code, parseInstr);

      // classes
      _.each(program.classes, function(cd, cname) {
        prog.push(new Instruction('', fn_invalid));
        prog.push(new Instruction('# --- class ' + cname.replace(/\n/g, ' ') + ' ---', fn_invalid));

        classes[cname] = makeClass(cd, cname);
      });
      breakpoints = new Array(prog.length);
      breakpointsList = [];

      // Resolve jumps
      _.each(jumps, function(jump) {
        jump.setOffset(labels[jump.label] - jump.offset);
      });
      jumps.length = 0;
    };

    Engine.prototype.reset = function() {
      sm.reset();
    };

    Engine.prototype.getProgramAsText = function() {
      return prog.map(function(instr) {
        return instr.toString();
      }).join('\n');
    };

    Engine.prototype.getProgramLength = function() {
      return prog.length;
    }


    // Execution control

    Engine.prototype.run = function() {
      // Carry on while we are not on a breakpoint that is different from the current one if any
      var curLine = sm.getNextLine();
      while (this.isRunning() && (!breakpoints[this.getNextLine()] || sm.getNextLine() === curLine)) {
        this.tick();
      }
    };

    Engine.prototype.stepOver = function() {
      var ln = 0;
      var slength = sm.scopes.length;

      // Run until we change line or we change scope depth
      ln = sm.getNextLine();
      while(this.isRunning() && ln === sm.getNextLine() && sm.scopes.length === slength) {
        this.tick();
      }

      // if we have function invocation (deeper scope)
      while (sm.scopes.length > slength) {
        // Run until we reach a higher scope depth (exit function)
        while (this.isRunning() && sm.scopes.length > slength) {
          this.tick();
          if (breakpoints[this.getNextLine()]) return; // In case of bp, we exit everything
        }
        // Finished the function invokation
        ln = sm.getNextLine(); // Next line is the last return instruction
        // Continue until a statement or a function invokation
        while(this.isRunning() && ln === sm.getNextLine() && sm.scopes.length === slength) {
          this.tick();
        }
      }
    };

    Engine.prototype.stepInto = function() {
      var ln = sm.getNextLine();
      while(this.isRunning() && ln === sm.getNextLine()) {
        this.tick();
      }
    };

    Engine.prototype.stepOut = function() {
      var slength = sm.scopes.length;
      var ln = this.getNextLine();
      while(this.isRunning() && sm.scopes.length >= slength) {
        this.tick();
        if (breakpoints[this.getNextLine()] && ln !== this.getNextLine()) return; // In case of bp, we exit everything
      }
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
      return sm.getNextLine();
    };

    Engine.prototype.getNextASMLine = function() {
      return sm.pc;
    };

    Engine.prototype.addBreakpointsListener = function(cb) {
      breakpointsListeners.push(cb);
    };

    Engine.prototype.removeBreakpointsListener = function(cb) {
      var index = breakpointsListeners.indexOf(cb);
      if(index > -1) {
        breakpointsListeners.splice(index, 1);
      }
    };

    Engine.prototype.notifyBreakpointsListeners = function() {
      for(var i in breakpointsListeners) {
        breakpointsListeners[i].call(null, breakpointsList);
      }
    };

    // line du breakpoint - 1<
    Engine.prototype.setBreakpoint = function(instr) {
      breakpoints[instr] = true;
      breakpointsList.push(instr);
      this.notifyBreakpointsListeners();
    };

    Engine.prototype.removeBreakpoint = function(instr) {
      breakpoints[instr] = false;
      var index = breakpointsList.indexOf(instr);
      if(index > -1) {
        if(breakpointsList.length === 1) {
          breakpointsList.length = 0;
        } 
        else {
          breakpointsList.splice(index, 1);
        }
      }
      this.notifyBreakpointsListeners();
    };

    Engine.prototype.hasBreakpoint = function(instr) {
      return breakpoints[instr];
    };

    Engine.prototype.isBreakable = function(instr) {
      return true;
    };

    // State dump
    Engine.prototype.getStack = function() {
      return [];
    };

    Engine.prototype.getCallStack = function() {
      return sm.scopes;
    };

    Engine.prototype.getCurrentScope = function() {
      return sm.currentScope();
    };




    return new Engine();
  }


  return {
    create: factory
  };

}());