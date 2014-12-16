
object Test {
  def main(): Unit = {
    println(new Tester().Test(10));
  }
}

class Tester {
  var i: Int;

  def Test(p: Int): String = {
    var t: String;

    i = p - 1;

    while(!(i <= this.getThreshold())) {
      t = this.concat(t, i);
      i = i - 1;
    }

    return t;
  }

  def concat(s: String, i: Int): String = {
    return s + i;
  }

  def getThreshold(): Int = {
    return 0;
  }
}


{
    "main": {
        "code": [
            "const 10",
            "new Tester",
            "invoke Test", 
            "println",
            "ret"
        ]
    },
    "classes": {
        "Tester": {
            "fields": {
                "t": "S"
            },
            "methods": {
                "concat": {
                    "args": [
                        {
                            "name": "s",
                            "type": "S"
                        },
                        {
                            "name": "i",
                            "type": "I"
                        }
                    ],
                    "vars": {
                        
                    },
                    "code": [
                        "lload s",
                        "lload i",
                        "add",
                        "ret"
                    ]
                },
                "getThreshold": {
                    "args": [
                        
                    ],
                    "vars": {
                        
                    },
                    "code": [
                        "const 0",
                        "ret"
                    ]
                },
                "Test": {
                    "args": [
                        {
                            "name": "p",
                            "type": "I"
                        }
                    ],
                    "vars": [
                        {
                            "name": "t",
                            "type": "S"
                        }
                    ],
                    "code": [
                        "lload p",
                        "const 1",
                        "sub",
                        "lstore i",
                        "label loop",
                        "lload i",
                        "this",
                        "invoke getThreshold",
                        "le",
                        "not",
                        "jz loop_end",
                        "lload i",
                        "fload t",
                        "this",
                        "invoke concat",
                        "fstore t",
                        "lload i",
                        "const 1",
                        "sub",
                        "lstore i",
                        "goto loop",
                        "label loop_end",
                        "fload t",
                        "ret"
                    ]
                }
            }
        }
    }
}