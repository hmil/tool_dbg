
object Test {
  def main(): Unit = {
    println(new Tester().Test());
  }
}

class Tester {
  var i: Int;

  def Test(p: Int[]): String = {
    var t: String;

    i = p.length - 1;

    while(!(i <= this.getThreshold())) {
      t = this.concat(t, i);
      i = i - 1;
    }

    return t;
  }

  def Concat(s: String, i: Int): String = {
    return s + i;
  }

  def getThreshold(): Int = {
    return 0;
  }
}

/*
  Instructions: 
    stat xx   : begin of a statement at source line xx
    push xx   : push expression xx (xx is literal, identifier)
    new  xx   : creates a new instance of xx and push result to the stack
    pop xx    : pops element and puts result in xx (xx is identifier)
    length    : pops 1 elem, gets its length, push result
    ret       : exits current method
    label ll  : labels the next instruction with ll
    invoke x y: pops y+1 elem, calls x on obj with arguments arg1, ..., argy. Stack is [obj, arg1, ..., argy -> ]
    bin xx    : pops 2 elems, invokes binary operator xx and push result [op1, op2 -> (op1 xx op2)], xx is any binary javascript operand
    unary  xx : pops 1 elem, invokes unary operator xx and push result [op1 -> xxop1], xx is any unary javascript operand
    je ll     : pops 1 elem, compares to 0, jumps to ll if equals
    jne ll    : pops 1 elem, compares to 0, jumps to ll if not equals
    jp ll     : jumps to ll

  notes:
    can translate shortcutted binary operand `a && b` simply by:
      push a
      push b
      bin &&
    need an index of all breakable lines
    map of labels => pc addr

*/