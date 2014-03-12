%right '='
%left  '||'
%left  '&&'
%left  '==' '!='
%left  '>=' '<=' '>' '<'
%left  '+' '-'
%left  '*' '/' '%'
%right '!' MINUS

%start root

%%

root
  : statements 
  ;

statements
  : statement  {console.log($1); }
  | statement statements  {console.log($1); }
  ;

statement
  : TEXT  {$$ = ['TEXT', $1]}
  | BTEXT  {$$ = ['BTEXT', $1]}
  | COMMENT  {$$ = ['COMMENT', $1]}
  | BCOMMENT  {$$ = ['BCOMMENT', $1]}
  | ID  {$$ = ['ID', $1]}
  | ATTR {$$ = ['ATTR', $1]}
  | '$'  {$$ = $1}
  | '('  {$$ = $1}
  | ')'  {$$ = $1}
  | '['  {$$ = $1}
  | ']'  {$$ = $1}
  | '{'  {$$ = $1}
  | '}'  {$$ = $1}
  | ':'  {$$ = $1}
  | ','  {$$ = $1}
  | ';'  {$$ = $1}
  | '..'  {$$ = $1}
  | IN  {$$ = ['IN', $1]}
  | TRUE  {$$ = ['TRUE', $1]}
  | FALSE  {$$ = ['FALSE', $1]}
  | NULL  {$$ = ['NULL', $1]}
  | '=='  {$$ = $1}
  | '!='  {$$ = $1}
  | '>='  {$$ = $1}
  | '<='  {$$ = $1}
  | '>'  {$$ = $1}
  | '<'  {$$ = $1}
  | '&&'  {$$ = $1}
  | '||'  {$$ = $1}
  | '!'  {$$ = $1}
  | '+'  {$$ = $1}
  | '-'  {$$ = $1}
  | '*'  {$$ = $1}
  | '/'  {$$ = $1}
  | '%'  {$$ = $1}
  | '='  {$$ = $1}
  | FLOAT  {$$ = ['FLOAT', $1]}
  | INTEGER  {$$ = ['INTEGER', $1]}
  | DSTRING  {$$ = ['DSTRING', $1]}
  | STRING  {$$ = ['STRING', $1]}
  | SET  {$$ = ['SET', $1]}
  | IF  {$$ = ['IF', $1]}
  | ELSEIF  {$$ = ['ELSEIF', $1]}
  | ELSE  {$$ = ['ELSE', $1]}
  | END  {$$ = ['END', $1]}
  | FOREACH  {$$ = ['FOREACH', $1]}
  | INCLUDE  {$$ = ['INCLUDE', $1]}
  | PARSE  {$$ = ['PARSE', $1]}
  | STOP  {$$ = ['STOP', $1]}
  | BREAK  {$$ = ['BREAK', $1]}
  | EVALUATE  {$$ = ['EVALUATE', $1]}
  | DEFINE  {$$ = ['DEFINE', $1]}
  | MACRO  {$$ = ['MACRO', $1]}
  | MACROCALL  {$$ = ['MACROCALL', $1]}
  | BMACROCALL  {$$ = ['BMACROCALL', $1]}
  ;
  