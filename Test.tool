
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
            "new Tester",
            "invoke Test", 
            "println",
            "ret"
        ]
    },
    "classes": {
        "Tester": {
            "fields": {
                "t": "String"
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
                        "load s",
                        "load i",
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
                            "name": "t",
                            "type": "[I"
                        }
                    ],
                    "vars": [
                        {
                            "name": "t",
                            "type": "S"
                        }
                    ],
                    "code": [
                        "load p",
                        "length",
                        "const 1",
                        "sub",
                        "store i",
                        "label loop",
                        "load i",
                        "this",
                        "invoke getThreshold",
                        "le",
                        "not",
                        "jz loop_end",
                        "this",
                        "load t",
                        "load i",
                        "invoke concat",
                        "store t",
                        "load i",
                        "const 1",
                        "sub",
                        "store i",
                        "goto loop",
                        "label loop_end",
                        "load t",
                        "ret"
                    ]
                }
            }
        }
    }
}