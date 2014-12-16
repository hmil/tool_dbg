ASM language definition
=======================

## Container format

JSON file:

- main
 - code [Instruction]
- classes
 - {name} 
  - fields
   - {name} -> type
  - methods
   - {name}
    - vars
    - args
     - name: String
     - type: type
    - code: [Instruction]

type: ("S"|"I"|"B"|"LclassName;"|"[type")

## Instruction set

- `stat x`    *marks source line for the next statement*
- `const x`   *push constant on the stack. x = ("string"|intlit|boolean)*
- `println`   *prints first elem of stack (and consumes it).*
- `label l`   *adds label for next instruction*
- `lload x`   *push local x on the stack. x = identifier
- `lstore x`  *stores element on top of the stack into local x. x = identifier*
- `fload x`   *push field x on the stack. x = identifier
- `fstore x`  *stores element on top of the stack into field x. x = identifier*
- `length`    *consumes an array on top of the stack and leaves its length instead*
- `dup`       *duplicates the element on top of the stack*
- `new x`     *puts a new instance of class x on top of the stack*
- `astore x`  *stores val in array x at index id. x = identifier, stack = {id, val -> }*
- `aload x`   *puts value at index id of array x on top of the stack. x = identifier, stack = {id -> val}*
- `invoke x`  *calls method x on obj obj and leaves result on stack. stack = {argn, ..., arg1, obj ->}*
- `ret`       *returns from subroutine*
- `sub/add/mul/div/lt/le/gt/ge/and/or`  *binary operations on top two operands. stack = {op1, op2 -> result}*
- `not`       *unary operation on top operand. stack = {op -> !op}
- `jz l`      *jumps to label l if top operand is 0. consumes top operand*
- `jnz l`     *like jz but negated*
- `goto l`    *jumps to label l unconditionnaly*
- `this`      *loads current 'this' object on the stack*
- `pop`       *pops first element of the stack*

## Other

Object representation for Engine API:
```javascript
object = {
  field1: int
  field2: {obscure reference object} toString -> "A"
}
```

Returned by `Engine.getScope`:
```javascript
scope: {
  this: object
  params: {name -> value}
  locals: {name -> value}
  fields: {name -> value}
}
```

Returned by `Engine.getCallStack`:
```javascript
callStack: [
  {
    line: Number
    scope: scope
  } toString -> "Object.method(type1, type2, ...):typeRet (line: line)"
]
```