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
  : statements             { return $1; }
  ;

statements
  : statement              { $$ = [$1]; }
  | statements statement   { $$ = $1.concat($2); }
  | /* epsilon */          { $$ = []; }
  ;

statement
  : TEXT                   { $$ = {type: 'Text', value: $1.replace(/\\([\$#])/g, '$1')}; }
  | BTEXT                  { $$ = {type: 'BText', value: $1.replace(/^#\[\[|\]\]#/g, '')}; }
  | COMMENT                { $$ = {type: 'Comment', value: $1.replace(/^##/, '')}; }
  | BCOMMENT               { $$ = {type: 'BComment', value: $1.replace(/^#\*|\*#$/g, '')}; }
  | reference              { $$ = $1; }
  | directive              { $$ = $1; }
  ;

reference
  : '$' ref                { $$ = {type: 'Reference', object: $2}; }
  | '$' '!' ref            { $$ = {type: 'Reference', object: $3, silent: true}; }
  | '$' '{' ref '}'        { $$ = {type: 'Reference', object: $3}; }
  | '$' '!' '{' ref '}'    { $$ = {type: 'Reference', object: $4, silent: true}; }
  ;

ref
  : id                     { $$ = $1; }
  | property               { $$ = $1; }
  | method                 { $$ = $1; }
  | index                  { $$ = $1; }
  ;

id
  : ID                     { $$ = {type: 'Identifier', name: $1}; }
  ;

prop
  : PROP                   { $$ = {type: 'Identifier', name: $1.replace(/^\./, '')}; }
  ;

property
  : id prop                { $$ = {type: 'Property', object: $1, prop: $2}; }
  | methodCall prop        { $$ = {type: 'Property', object: $1, prop: $2}; }
  | index prop             { $$ = {type: 'Property', object: $1, prop: $2}; }
  | property prop          { $$ = {type: 'Property', object: $1, prop: $2}; }
  ;

methodCall
  : property '(' call ')'  { $$ = {type: 'MethodCall', callee: $1, args: $3}; }
  ;

index
  : id idx
  | property idx
  | index idx
  ;

idx
  : '[' idxExp ']'
  ;

idxExp
  : reference
  | integer
  | dstring
  | string
  ;

range
  : '[' rangeItem '..' rangeItem ']'
  ;

rangeItem
  : reference
  | integer
  | '-' integer
  ;

list
  : '[' singleExps ']'
  ;

map
  : '{' mapItems '}'
  ;

mapItems
  : mapItem
  | mapItems ',' mapItem
  | /* epsilon */
  ;

mapItem
  : singleExp ':' singleExp
  ;

exp
  : singleExp
  | '(' exp ')'
  | '!' exp
  | '-' exp
  | exp '*'  exp
  | exp '/'  exp
  | exp '%'  exp
  | exp '+'  exp
  | exp '-'  exp
  | exp '>=' exp
  | exp '>'  exp
  | exp '<=' exp
  | exp '<'  exp
  | exp '==' exp
  | exp '!=' exp
  | exp '&&' exp
  | exp '||' exp
  ;

equalExp
  : reference '=' exp
  ;

singleExps
  : singleExp
  | args ',' singleExp
  | /* epsilon */          { $$ = []; }
  ;

singleExp
  : reference
  | number
  | dstring
  | string
  | range
  | list
  | map
  | TRUE
  | FALSE 
  | NULL
  ;

number
  : integer
  | float
  ;

integer
  : INTEGER
  ;

float:
  : FLOAT
  ;

dstring
  : DSTRING
  ;

string
  : STRING
  ;

directive
  : SET '(' equalExp ')'
  | ifDirective
  | FOREACH '(' reference IN reference ')' statements END
  | INCLUDE '(' singleExps ')'
  | PARSE '(' singleExp ')'
  | EVALUATE '(' singleExp ')'
  | DEFINE '(' reference ')' statements END
  | MACRO '(' ID macroParams ')' statements END
  | MACROCALL '(' macroParams ')'
  | BMACROCALL '(' macroParams ')' statement END
  | STOP
  | BREAK
  ;

ifDirective
  : if END
  | if elseifs END
  | if elseifs else END
  ;

if
  : IF '(' exp ')' statements
  ;

else
  : ELSE statements
  ;

elseifs
  : elseif
  | elseifs elseif
  | /* epsilon */
  ;

elseif
  : ELSEIF '(' exp ')' statements
  ;

macroParams
  : singleExp
  | macroParams singleExp
  | /* epsilon */
  ;
