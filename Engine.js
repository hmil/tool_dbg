'use strict';

var Engine = window.Engine = (function() {

  function StateMachine() {
    this.pc = 2; // Skips the initial comments. First instr executed is 2
    this.stack = [];
    //this.scopes = [{locals:{}}];
    this.hasEnded = false;
    this.callStack = [{scope: {locals: {}}}]
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
    return this.callStack[this.callStack.length - 1].scope;
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
    //sm.scopes.pop();
    var call = sm.callStack.pop();
    if (sm.callStack.length === 0) {
      sm.hasEnded = true;
    }
    else {
      sm.pc = call.line;
    }
  }
  function fn_print(sm) {
    log.info(sm.pop())
  }

  function fn_this(sm) {
    sm.push(sm.getCurrentScope()['this']);
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
    /*var intVal = parseInt(value);
    if (!_.isNaN(intVal)) value = intVal;*/
    Instruction.call(this, '\tconst '+value, function(sm) {
      sm.push(JSON.parse(value));
    });
  }
  _.extend(Instr_Const.prototype, Instruction.prototype);

  // load x
  function Instr_Load(identifier) {
    Instruction.call(this, "\tlload "+identifier, function(sm) {
      sm.push(sm.getLocalValue(identifier))
    });
  }
  _.extend(Instr_Load.prototype, Instruction.prototype)

  // store x
  function Instr_Store(identifier) {
    Instruction.call(this, "\tlstore "+identifier, function(sm) {
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
      if(!invert && value != 0 || invert && value == 0) {
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
      var second = sm.pop();
      var first = sm.pop();
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
  _.extend(Instr_BaseBinaryComparison.prototype, Instruction.prototype)


  function Instr_New(className) {
    Instruction.call(this, "\tnew "+className, function(sm, prog) {
      var fieldsValues = {};
      for(var field in prog.classes[className].fields) {
        fieldsValues[field] = undefined
      }

      sm.push(new Instance(className, fieldsValues, sm.pc));
    })
  }

  function Instance(className, fields, id) {
    this.className = className;
    this.fields = fields;
    this.id = id;
  }

  Instance.prototype.toString = function() {
    var str = this.className + "@" + this.id;
    var valuedFields = {};
    for(var field in this.fields) {
      if(typeof this.fields[field] !== 'undefined') {
        valuedFields[field] = this.fields[field];
      }
    }
    str += "{" +_(valuedFields).map(function(value, key) {
      return key+"="+value
    }).join(",") + "}";

    return str;
  }

  function Instr_Fload(fieldname) {
    Instruction.call(this, "\tfload "+fieldname, function(sm, prog) {
      var inst = sm.getCurrentScope()['this']
      if(typeof inst === 'undefined') {
        inst = sm.pop();
      }
      sm.push(inst.fields[fieldname])
    })
  }
  _.extend(Instr_Fload.prototype, Instruction.prototype)

  function Instr_Fstore(fieldname) {
    Instruction.call(this, "\tfstore "+fieldname, function(sm, prog) {
      var value = sm.pop();
      var inst = sm.getCurrentScope()['this']
      if(typeof inst === 'undefined') {
        inst = sm.pop();
      }
      inst.fields[fieldname] = value;
    });
  }
  _.extend(Instr_Fstore.prototype, Instruction.prototype)

  function Instr_Invoke(methodName) {
    Instruction.call(this, "\tinvoke "+methodName, function(sm, prog) {
      //var inst = sm.pop();
      var inst = sm.getCurrentScope()['this'];
      if(typeof inst === 'undefined') {
        inst = sm.pop();
      }
      var method = prog.classes[inst.className].methods[methodName];
      var args = method.args;
      var nbParams = Object.keys(args).length;
      var paramNames = _(args).map(function(obj) { return obj.name; });
      var paramsValues = {};
      for(var i = 0; i < nbParams; ++i) {
        paramsValues[paramNames[i]] = sm.pop();
      }
      var newScope = {};
      newScope['this'] = inst;
      newScope.params = paramsValues;
      newScope.locals = {};
      newScope.fields = inst.fields;

      var newCall = {};
      newCall.scope = newScope;
      newCall.line = sm.pc;
      sm.callStack.push(newCall);
      sm.pc = method.pos - 1;
    });
  }
  _.extend(Instr_Invoke.prototype, Instruction.prototype)


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
      case 'lload':
        return new Instr_Load(args);
      case 'lstore':
        return new Instr_Store(args);
      case 'fload':
        return new Instr_Fload(args);
      case 'fstore':
        return new Instr_Fstore(args);
      case 'new':
        return new Instr_New(args);
      case 'invoke':
        return new Instr_Invoke(args);
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
      case 'this': 
        return new Instruction("\tthis", fn_this)

      default:
        return new Instruction('\t#' + text, fn_nop);
    }
  }


  function factory() {

    var sm = new StateMachine();

    var instructions = [];

    var breakpoints = [];
    var programStruct =  {}

    function Engine() {
      this.sm = sm;
      this.prog = instructions;
    }

    function parseInstr(instr) {
      var parsed = createInstr(instr);

      if (parsed.isLabel) {
        instructions.push(new Instruction('', fn_nop));
        programStruct.labels[parsed.name] = instructions.length;
      }
      instructions.push(parsed);
    }

    // Program loading, printing

    Engine.prototype.load = function(program) {

      this.reset();

      programStruct = program;
      programStruct.labels = {};

      instructions.push(new Instruction('# --- main ---', fn_invalid));
      instructions.push(new Instruction('', fn_invalid));

      // main
      _.each(program.main.code, parseInstr);

      // classes
      _.each(program.classes, function(cd, cname) {
        instructions.push(new Instruction('', fn_invalid));
        instructions.push(new Instruction('# --- class ' + cname.replace(/\n/g, ' ') + ' ---', fn_invalid));

        _.each(cd.methods, function(md, mname) {
          instructions.push(new Instruction('', fn_invalid));
          instructions.push(new Instruction('# ' + mname.replace(/\n/g, ' '), fn_invalid));
          instructions.push(new Instruction('', fn_invalid));
          programStruct.classes[cname].methods[mname].pos = instructions.length;

          _.each(md.code, parseInstr);
        });
      });

      breakpoints = new Array(instructions.length);
      window.struct = programStruct;
    };

    Engine.prototype.reset = function() {
      instructions.length = 0;
      programStruct = {}
      programStruct.labels = {};
      breakpoints.length = 0;
      sm.reset();
    };

    Engine.prototype.getProgramAsText = function() {
      return instructions.map(function(instr) {
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
      instructions[sm.pc].exec(sm, programStruct);
      console.log("Stack after "+instructions[sm.pc]._code.substring(1)+": \n--> ["+sm.stack.join(", ")+"]")
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