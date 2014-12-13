
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
    ret       : exits current method or terminates the program if in main
    label ll  : labels the next instruction with ll
    invoke x y: pops y+1 elem, calls x on obj with arguments arg1, ..., argy. Stack is [obj, arg1, ..., argy -> ]

    sub
    add
    mul
    div

    lt
    le
    gt
    ge

    not
    and
    or

    je ll     : pops 1 elem, compares to 0, jumps to ll if equals
    jne ll    : pops 1 elem, compares to 0, jumps to ll if not equals
    jp ll     : jumps to ll

  notes:
    need an index of all breakable lines

*/