var _prog = {
  QS: {
    members: {
      number: 'a',
      size: 'i'
    },
    meths: {
      Start: {
        vars: {
          aux01: 'i'
        },
        args: {
          sz: 'i'
        },
        stats: [
          { l: 18, type='assign', a: 'aux01', exp: {
            type: 'mCall', obj: 'this', m:'Init', args: [{
              type: 'id',
              id: 'ez'
            }]
          }},
          { l: 19, c: 'aux01=this.Print()'},
          { l: 20, c: 'println(9999)'},
          { l: 21, c: 'aux01 = size - 1'},
          { l: 22, c: 'aux01 = this.Sort(0,aux01)'},
          { l: 23, c: 'aux01 = this.Print()'},
          { l: 24, r: 'return 9999'}
        ]
      }
    }
  }
};

/*
  prog: {
    classes: {
      Tester: {
        members: {
          i: 'Int'
        },
        meths: {
          Test: {
            vars: {
              t: 'String'
            },
            args: {
              p: 'IntArray'
            },
            code: [
              'stat 13',
              
            ]
          }
        }
      }
    }
  }

*/

/*



*/

_stat(3, _log(new QS().Start(10)));


function QS() {
  var number = _member(QS, 'number', new Int32Array());
  var size = _member(QS, 'number', new Int32Array());


  /*
  'stat 18',
  'push ez',
  'call this.Init 1',
  'assign aux01',
  'stat 19',
  'call this.Print 0',
  'assign aux01',
  'stat 20',
  'push 9999',
  'callstatic println',
  'stat 21',
  'push size',
  'push 1',
  'sub',
  'assign aux01',
  'stat 22',
  'push aux01',
  'push 0',
  'call this.Sort 2',
  'assign aux01',
  'stat 23',
  'call this.Print 0',
  'assign aux01'
  'stat 24'
  'push 9999',
  'ret'
  */
  this.Start = function(sz) {
    var aux01 = 0;
    _expr(18, function(){ return this.Init(sz); });
    aux01 = _expr(19, function(){ return this.Print(); });
    _log(_expr(function() { return 9999 }));
    aux01 = _expr(21, function(){ return size - 1; });
    aux01 = _expr(22, function(){ return this.Sort(0, aux01); });
    aux01 = _expr(23, function(){ return this.Print(); });
    aux01 = _ret(24);
  };

  this.Sort = function(sz) {
    var v : Int;
    var i : Int;
    var j : Int;
    var nt : Int;
    var t : Int;
    var cont01 : Bool;
    var cont02 : Bool;
    var aux03 : Int;

    t = _expr(38, function(){ return 0; });
    if (_expr(39, function(){ return left < right; })) {
      v = _expr(40, function(){ return number[right]; });
      i = left - 1 ;
      j = right ;
      cont01 = true ;
      while (cont01){
          cont02 = true ;
          while (cont02){
              i = i + 1 ;
              aux03 = number[i] ;
              if (!(aux03<v)) cont02 = false ;
              else cont02 = true ;
          }
          cont02 = true ;
          while (cont02){
              j = j - 1 ;
              aux03 = number[j] ;
              if (!(v < aux03)) cont02 = false ;
              else cont02 = true ;
          }


          t = number[i] ;
          number[i] = number[j] ;
          number[j] = t ;
          //aux03 = i + 1 ;
          if ( j < (i+1)) cont01 = false ;
          else cont01 = true ;
      }
      number[j] = number[i] ;
      number[i] = number[right] ;
      number[right] = t ;
      nt = this.Sort(left,i-1);
      nt = this.Sort(i+1,right);
  }
  else nt = 0 ;
  return 0 ;
}

def Print() : Int = {
  var j : Int;

  j = 0 ;
  while (j < (size)) {
      println(number[j]);
      j = j + 1 ;
  }
  return 0 ;
}

// Initialize array of integers
def Init(sz : Int) : Int = {
  size = sz ;
  number = new Int[sz] ;

  number[0] = 20 ;
  number[1] = 7  ; 
  number[2] = 12 ;
  number[3] = 18 ;
  number[4] = 2  ; 
  number[5] = 11 ;
  number[6] = 6  ; 
  number[7] = 9  ; 
  number[8] = 19 ; 
  number[9] = 5  ;

  return 0 ;  
}
}