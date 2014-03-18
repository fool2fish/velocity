%right '='
%left  '||'
%left  '&&'
%left  '==' '!='
%left  '>=' '<=' '>' '<'
%left  '+' '-'
%left  '*' '/' '%'
%right '!'

%start root

%%

root
  : EOF                          { return []; }
  | statements EOF               { console.log(require('util').inspect($1, { depth: null })); return $1; }
  ;

statements
  : statement                    { $$ = [$1]; }
  | statement statements         { $$ = [].concat($1, $2); }
  ;

statement
  : TEXT                         { $$ = {type: 'Text', value: $1.replace(/\\(?=#|\$)/g, '')}; }
  | BTEXT                        { $$ = {type: 'BText', value: $1.replace(/^#\[\[|\]\]#/g, '')}; }
  | COMMENT                      { $$ = {type: 'Comment', value: $1.replace(/^##/, '')}; }
  | BCOMMENT                     { $$ = {type: 'BComment', value: $1.replace(/^#\*|\*#$/g, '')}; }
  | reference                    { $$ = $1; }
  | directive                    { $$ = $1; }
  ;


reference
  : '$' ref                      { $$ = {type: 'Reference', object: $2}; }
  | '$' '!' ref                  { $$ = {type: 'Reference', object: $3, silent: true}; }
  | '$' '{' ref '}'              { $$ = {type: 'Reference', object: $3}; }
  | '$' '!' '{' ref '}'          { $$ = {type: 'Reference', object: $4, silent: true}; }
  ;

ref
  : id                           { $$ = $1; }
  | property                     { $$ = $1; }
  | methodCall                       { $$ = $1; }
  | index                        { $$ = $1; }
  ;

id
  : ID                           { $$ = {type: 'Identifier', name: $1}; }
  ;

prop
  : PROP                         { $$ = {type: 'Identifier', name: $1.replace(/^\./, '')}; }
  ;

property
  : id prop                      { $$ = {type: 'Property', object: $1, prop: $2}; }
  | methodCall prop              { $$ = {type: 'Property', object: $1, prop: $2}; }
  | index prop                   { $$ = {type: 'Property', object: $1, prop: $2}; }
  | property prop                { $$ = {type: 'Property', object: $1, prop: $2}; }
  ;

methodCall
  : property '(' singleExps ')'  { $$ = {type: 'MethodCall', callee: $1, args: $3}; }
  | property '(' ')'             { $$ = {type: 'MethodCall', callee: $1, args: []}; }
  ;

index
  : id '[' idxExp ']'            { $$ = {type: 'Index', object: $1, prop: $3}; }
  | property '[' idxExp ']'      { $$ = {type: 'Index', object: $1, prop: $3}; }
  | index '[' idxExp ']'         { $$ = {type: 'Index', object: $1, prop: $3}; }
  ;

idxExp
  : reference                    { $$ = $1; }
  | integer                      { $$ = $1; }
  | dstring                      { $$ = $1; }
  | string                       { $$ = $1; }
  ;

range
  : '[' reference '..' reference ']'  { $$ = {type: 'Range', start: $2, end: $4}; }
  | '[' reference '..' integer ']'    { $$ = {type: 'Range', start: $2, end: $4}; }
  | '[' integer '..' reference ']'    { $$ = {type: 'Range', start: $2, end: $4}; }
  | '[' integer '..' integer ']'      { $$ = {type: 'Range', start: $2, end: $4}; }
  ; 

list
  : '[' singleExps ']'           { $$ = {type: 'List', elements: $2}; }
  | '[' ']'                      { $$ = {type: 'List', elements: []}; }
  ;

map
  : '{' mapItems '}'             { $$ = {type: 'Map', mapItems: $2}; }
  | '{' '}'                      { $$ = {type: 'Map', mapItems: []}; }
  ;

mapItems
  : mapItem                      { $$ = [$1]; }
  | mapItems ',' mapItem         { $$ = $1.concat($3); }
  ;

mapItem
  : singleExp ':' singleExp      { $$ = {type: 'MapItem', key: $1, value: $3}; }
  ;

exp
  : singleExp                    { $$ = $1; }
  | '(' exp ')'                  { $$ = $2; }
  | '-' '(' exp ')'              { $$ = {type: 'UnaryExp', operator: '-', argument: $3}; }
  | '!' exp                      { $$ = {type: 'UnaryExp', operator: '!', argument: $2}; }
  | exp '*'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '/'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '%'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '+'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '-'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '>=' exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '>'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '<=' exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '<'  exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '==' exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '!=' exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '&&' exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  | exp '||' exp                 { $$ = {type: 'BinaryExp', operator: $2, left: $1, right: $3}; }
  ;

equalExp
  : reference '=' exp            { $$ = {type: 'EqualExp', left: $1, right: $3}; }
  | reference '=' equalExp       { $$ = {type: 'EqualExp', left: $1, right: $3}; }
  ;

singleExps
  : singleExp                    { $$ = [$1]; }
  | singleExps ',' singleExp     { $$ = $1.concat($3); }
  ;

singleExp
  : reference                    { $$ = $1; }
  | integer                      { $$ = $1; }
  | float                        { $$ = $1; }
  | dstring                      { $$ = $1; }
  | string                       { $$ = $1; }
  | range                        { $$ = $1; }
  | list                         { $$ = $1; }
  | map                          { $$ = $1; }
  | TRUE                         { $$ = {type: 'Boollean', value: true}; }
  | FALSE                        { $$ = {type: 'Boollean', value: false}; }
  | NULL                         { $$ = {type: 'Null', value: null}; }
  ;

integer
  : INTEGER                      { $$ = {type: 'Integer', value: parseInt($1)}; }
  | '-' INTEGER                  { $$ = {type: 'Integer', value: - parseInt($2)}; }
  ;

float
  : FLOAT                        { $$ = {type: 'Float', value: parseFloat($1)}; }
  | '-' FLOAT                    { $$ = {type: 'Float', value: - parseInt($2)}; }
  ;

dstring
  : DSTRING                      { $$ = {type: 'DString', value: $1.replace(/^"|"$/g, '').replace(/\\"/g, '"')}; }
  ;

string
  : STRING                       { $$ = {type: 'String', value: $1.replace(/^'|'$/g, '')}; }
  ;

directive
  : SET '(' equalExp ')'
      { $$ = {type: 'Set', body: $3}; }
  | if
      { $$ = $1; }
  | FOREACH '(' reference IN reference ')' statements END
      { $$ = {type: 'Foreach', left: $3, right: $5, body: $7}; }
  | FOREACH '(' reference IN reference ')' END
      { $$ = {type: 'Foreach', left: $3, right: $5}; }
  | INCLUDE '(' singleExps ')'
      { $$ = {type: 'Include', arg: $3}; }
  | PARSE '(' singleExp ')'
      { $$ = {type: 'Parse', arg: $3}; }
  | EVALUATE '(' singleExp ')'
      { $$ = {type: 'Evaluate', arg: $3}; }
  | DEFINE '(' reference ')' statements END
      { $$ = {type: 'Define', name: $3, body: $5}; }
  | DEFINE '(' reference ')' END
      { $$ = {type: 'Define', name: $3}; }
  | MACRO '(' ID delim macroParams ')' statements END
      { $$ = {type: 'Macro', name: $3, args: $5, body: $7}; }
  | MACRO '(' ID ')' statements END
      { $$ = {type: 'Macro', name: $3, body: $5}; }
  | MACRO '(' ID delim macroParams ')' END
      { $$ = {type: 'Macro', name: $3, args: $5}; }
  | MACRO '(' ID ')' END
      { $$ = {type: 'Macro', name: $3}; }
  | MACROCALL '(' macroParams ')'
      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), args: $3}; }
  | MACROCALL '(' ')'
      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), args: []}; }
  | BMACROCALL '(' macroParams ')' statement END
      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), args: $3, body: $5}; }
  | BMACROCALL '(' ')' statement END
      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), args: [], body: $4}; }
  | BMACROCALL '(' macroParams ')' END
      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), args: $3}; }
  | BMACROCALL '(' ')' END
      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), args: []}; }
  | STOP
      { $$ = {type: 'Stop'}; }
  | BREAK
      { $$ = {type: 'Break'}; }
  ;

else
  : ELSE statements
      { $$ = $2; }
  | ELSE
      { $$ = undefined; }
  ;

elseif
  : ELSEIF '(' exp ')' statements
      { $$ = {type: 'If', test: $3, consequent: $5}; }
  | ELSEIF '(' exp ')'
      { $$ = {type: 'If', test: $3}; }
  | ELSEIF '(' exp ')' statements else
      { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | ELSEIF '(' exp ')' else
      { $$ = {type: 'If', test: $3, alternate: $5}; }
  | ELSEIF '(' exp ')' statements elseif
      { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | ELSEIF '(' exp ')' elseif
      { $$ = {type: 'If', test: $3, alternate: $6}; }
  ;

if
  : IF '(' exp ')' statements END
      { $$ = {type: 'If', test: $3, consequent: $5}; }
  | IF '(' exp ')' END
      { $$ = {type: 'If', test: $3}; }
  | IF '(' exp ')' statements else END
      { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | IF '(' exp ')' else END
      { $$ = {type: 'If', test: $3,  alternate: $5}; }
  | IF '(' exp ')' statements elseif END
      { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | IF '(' exp ')' elseif END
      { $$ = {type: 'If', test: $3, alternate: $5}; }
  ;

macroParams
  : singleExp                    { $$ = [$1]; }
  | macroParams delim singleExp  { $$ = $1.concat($3); }
  ;

delim
  : WS
  | ','
  ;

