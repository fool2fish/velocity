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
  : EOF                               { return []; }
  | statements EOF                    { return $1; }
  ;


statements
  : states                            { $$ = {type: 'Statements', body: $1}; }
  ;
  
states
  : statement                         { $$ = [$1]; }
  | statement states                  { $$ = [$1].concat($2); }
  ;

statement
  : TEXT                              { $$ = {type: 'Text', value: $1.replace(/\\(?=#|\$)/g, '')}; }
  | BTEXT                             { $$ = {type: 'BText', value: $1.replace(/^#\[\[|\]\]#/g, '')}; }
  | COMMENT                           { $$ = {type: 'Comment', value: $1.replace(/^##/, '')}; }
  | BCOMMENT                          { $$ = {type: 'BComment', value: $1.replace(/^#\*|\*#$/g, '')}; }
  | reference                         { $$ = $1; }
  | directive                         { $$ = $1; }
  ;

reference
  : '$' ref                           { $$ = {type: 'Reference', object: $2}; }
  | '$' '!' ref                       { $$ = {type: 'Reference', object: $3, silent: true}; }
  | '$' '{' ref '}'                   { $$ = {type: 'Reference', object: $3}; }
  | '$' '!' '{' ref '}'               { $$ = {type: 'Reference', object: $4, silent: true}; }
  ;

ref
  : id                                { $$ = $1; }
  | property                          { $$ = $1; }
  | methodCall                        { $$ = $1; }
  | index                             { $$ = $1; }
  ;

id
  : ID                                { $$ = {type: 'Identifier', name: $1}; }
  ;

prop
  : PROP                              { $$ = {type: 'Identifier', name: $1.replace(/^\./, '')}; }
  ;

property
  : id prop                           { $$ = {type: 'Property', object: $1, property: $2}; }
  | method prop                       { $$ = {type: 'Property', object: $1, property: $2}; }
  | index prop                        { $$ = {type: 'Property', object: $1, property: $2}; }
  | property prop                     { $$ = {type: 'Property', object: $1, property: $2}; }
  ;

method
  : property '(' exprItems ')'        { $$ = {type: 'Method', callee: $1, arguments: $3}; }
  | property '(' ')'                  { $$ = {type: 'Method', callee: $1, arguments: []}; }
  ;

index
  : id '[' idxExpr ']'                { $$ = {type: 'Index', object: $1, property: $3}; }
  | method '[' idxExpr ']'            { $$ = {type: 'Index', object: $1, property: $3}; }
  | property '[' idxExpr ']'          { $$ = {type: 'Index', object: $1, property: $3}; }
  | index '[' idxExpr ']'             { $$ = {type: 'Index', object: $1, property: $3}; }
  ;

idxExpr
  : reference                         { $$ = $1; }
  | integer                           { $$ = $1; }
  | dstring                           { $$ = $1; }
  | string                            { $$ = $1; }
  ;

/* Why cannot simplify the production of range: https://github.com/zaach/jison/issues/212 */
range
  : '[' reference '..' reference ']'  { $$ = {type: 'Range', start: $2, end: $4}; }
  | '[' reference '..' integer ']'    { $$ = {type: 'Range', start: $2, end: $4}; }
  | '[' integer '..' reference ']'    { $$ = {type: 'Range', start: $2, end: $4}; }
  | '[' integer '..' integer ']'      { $$ = {type: 'Range', start: $2, end: $4}; }
  ;

list
  : '[' exprItems ']'                 { $$ = {type: 'List', elements: $2}; }
  | '[' ']'                           { $$ = {type: 'List', elements: []}; }
  ;

map
  : '{' mapItems '}'                  { $$ = {type: 'Map', mapItems: $2}; }
  | '{' '}'                           { $$ = {type: 'Map', mapItems: []}; }
  ;

mapItems
  : mapItem                           { $$ = [$1]; }
  | mapItem ',' mapItems              { $$ = [$1].concat($3); }
  ;

mapItem
  : exprItem ':' exprItem             { $$ = {type: 'MapItem', key: $1, value: $3}; }
  ;

expr
  : exprItem                          { $$ = $1; }
  | '(' expr ')'                      { $$ = $2; }
  | '!' expr                          { $$ = {type: 'UnaryExpr', operator: $1, argument: $2}; }
  | expr '*'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '/'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '%'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '+'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '-'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '>=' expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '>'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '<=' expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '<'  expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '==' expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '!=' expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '&&' expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  | expr '||' expr                    { $$ = {type: 'BinaryExpr', operator: $2, left: $1, right: $3}; }
  ;

equalExpr
  : reference '=' expr                { $$ = {type: 'EqualExpr', left: $1, right: $3}; }
  | reference '=' equalExpr           { $$ = {type: 'EqualExpr', left: $1, right: $3}; }
  ;

exprItems
  : exprItem                          { $$ = [$1]; }
  | exprItem ',' exprItems            { $$ = [$1].concat($3); }
  ;

exprItem
  : reference                         { $$ = $1; }
  | integer                           { $$ = $1; }
  | float                             { $$ = $1; }
  | dstring                           { $$ = $1; }
  | string                            { $$ = $1; }
  | range                             { $$ = $1; }
  | list                              { $$ = $1; }
  | map                               { $$ = $1; }
  | TRUE                              { $$ = {type: 'Literal', value: true}; }
  | FALSE                             { $$ = {type: 'Literal', value: false}; }
  | NULL                              { $$ = {type: 'Literal', value: null}; }
  ;

integer
  : INTEGER                           { $$ = {type: 'Literal', value: parseInt($1)}; }
  | '-' INTEGER                       { $$ = {type: 'Literal', value: - parseInt($2)}; }
  ;

float
  : FLOAT                             { $$ = {type: 'Literal', value: parseFloat($1)}; }
  | '-' FLOAT                         { $$ = {type: 'Literal', value: - parseInt($2)}; }
  ;

dstring
  : DSTRING                           { $$ = {type: 'DString', value: $1.replace(/^"|"$/g, '').replace(/\\"/g, '"')}; }
  ;

string
  : STRING                            { $$ = {type: 'Literal', value: $1.replace(/^'|'$/g, '')}; }
  ;

directive
  : SET '(' equalExpr ')'                                  { $$ = {type: 'Set', body: $3}; }
  | if                                                     { $$ = $1; }
  | FOREACH '(' reference IN reference ')' statements END  { $$ = {type: 'Foreach', left: $3, right: $5, body: $7}; }
  | FOREACH '(' reference IN reference ')' END             { $$ = {type: 'Foreach', left: $3, right: $5}; }
  | INCLUDE '(' exprItems ')'                              { $$ = {type: 'Include', arguments: $3}; }
  | PARSE '(' exprItem ')'                                 { $$ = {type: 'Parse', argument: $3}; }
  | EVALUATE '(' exprItem ')'                              { $$ = {type: 'Evaluate', argument: $3}; }
  | DEFINE '(' reference ')' statements END                { $$ = {type: 'Define', name: $3, body: $5}; }
  | DEFINE '(' reference ')' END                           { $$ = {type: 'Define', name: $3}; }
  | MACRO '(' ID delim macroParams ')' statements END      { $$ = {type: 'Macro', name: $3, arguments: $5, body: $7}; }
  | MACRO '(' ID ')' statements END                        { $$ = {type: 'Macro', name: $3, body: $5}; }
  | MACRO '(' ID delim macroParams ')' END                 { $$ = {type: 'Macro', name: $3, arguments: $5}; }
  | MACRO '(' ID ')' END                                   { $$ = {type: 'Macro', name: $3}; }
  | MACROCALL '(' macroParams ')'                          { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), arguments: $3}; }
  | MACROCALL '(' ')'                                      { $$ = {type: 'MacroCall', name: $1.replace(/^#{?|}$/g, ''), arguments: []}; }
  | BMACROCALL '(' macroParams ')' statement END           { $$ = {type: 'MacroCall', name: $1.replace(/^#@{?|}$/g, ''), arguments: $3, body: $5}; }
  | BMACROCALL '(' ')' statement END                       { $$ = {type: 'MacroCall', name: $1.replace(/^#@{?|}$/g, ''), arguments: [], body: $4}; }
  | BMACROCALL '(' macroParams ')' END                     { $$ = {type: 'MacroCall', name: $1.replace(/^#@{?|}$/g, ''), arguments: $3}; }
  | BMACROCALL '(' ')' END                                 { $$ = {type: 'MacroCall', name: $1.replace(/^#@{?|}$/g, ''), arguments: []}; }
  | STOP                                                   { $$ = {type: 'Stop'}; }
  | BREAK                                                  { $$ = {type: 'Break'}; }
  ;

else
  : ELSE                                   { $$ = undefined; }
  | ELSE statements                        { $$ = $2; }
  ;

elseif
  : ELSEIF '(' expr ')' statements         { $$ = {type: 'If', test: $3, consequent: $5}; }
  | ELSEIF '(' expr ')'                    { $$ = {type: 'If', test: $3}; }
  | ELSEIF '(' expr ')' statements else    { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | ELSEIF '(' expr ')' else               { $$ = {type: 'If', test: $3, alternate: $5}; }
  | ELSEIF '(' expr ')' statements elseif  { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | ELSEIF '(' expr ')' elseif             { $$ = {type: 'If', test: $3, alternate: $6}; }
  ;

if
  : IF '(' expr ')' statements END         { $$ = {type: 'If', test: $3, consequent: $5}; }
  | IF '(' expr ')' END                    { $$ = {type: 'If', test: $3}; }
  | IF '(' expr ')' statements else END    { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | IF '(' expr ')' else END               { $$ = {type: 'If', test: $3,  alternate: $5}; }
  | IF '(' expr ')' statements elseif END  { $$ = {type: 'If', test: $3, consequent: $5, alternate: $6}; }
  | IF '(' expr ')' elseif END             { $$ = {type: 'If', test: $3, alternate: $5}; }
  ;

macroParams
  : exprItem                               { $$ = [$1]; }
  | exprItem delim macroParams             { $$ = [$1].concat($3); }
  ;

delim
  : WS
  | ','
  ;

