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
  : EOF                               { return {type: 'Statements', pos: @$, body: []}; }
  | statements EOF                    { return $1; }
  ;


statements
  : states                            { $$ = {type: 'Statements', pos: @$, body: $1}; }
  ;
  
states
  : statement                         { $$ = [$1]; }
  | statement states                  { $$ = [$1].concat($2); }
  ;

statement
  : TEXT                              { $$ = {type: 'Text', pos: @$, value: $1.replace(/\\(?=#|\$)/g, '')}; }
  | BTEXT                             { $$ = {type: 'BText', pos: @$, value: $1.replace(/^#\[\[|\]\]#/g, '')}; }
  | COMMENT                           { $$ = {type: 'Comment', pos: @$, value: $1.replace(/^##/, '')}; }
  | BCOMMENT                          { $$ = {type: 'BComment', pos: @$, value: $1.replace(/^#\*|\*#$/g, '')}; }
  | reference                         { $$ = $1; }
  | directive                         { $$ = $1; }
  ;

reference
  : '$' ref                           { $$ = {type: 'Reference', pos: @$, object: $2}; }
  | '$' '!' ref                       { $$ = {type: 'Reference', pos: @$, object: $3, silent: true}; }
  | '$' '{' ref '}'                   { $$ = {type: 'Reference', pos: @$, object: $3, wrapped: true}; }
  | '$' '!' '{' ref '}'               { $$ = {type: 'Reference', pos: @$, object: $4, silent: true, wrapped: true}; }
  ;

ref
  : id                                { $$ = $1; }
  | property                          { $$ = $1; }
  | method                            { $$ = $1; }
  | index                             { $$ = $1; }
  ;

id
  : ID                                { $$ = {type: 'Identifier', pos: @$, name: $1}; }
  ;

prop
  : PROP                              { $$ = {type: 'Prop', pos: @$, name: $1.replace(/^\./, '')}; }
  ;

property
  : id prop                           { $$ = {type: 'Property', pos: @$, object: $1, property: $2}; }
  | method prop                       { $$ = {type: 'Property', pos: @$, object: $1, property: $2}; }
  | index prop                        { $$ = {type: 'Property', pos: @$, object: $1, property: $2}; }
  | property prop                     { $$ = {type: 'Property', pos: @$, object: $1, property: $2}; }
  ;

method
  : property '(' exprItems ')'        { $$ = {type: 'Method', pos: @$, callee: $1, arguments: $3}; }
  | property '(' ')'                  { $$ = {type: 'Method', pos: @$, callee: $1, arguments: []}; }
  ;

index
  : id '[' exprItem ']'               { $$ = {type: 'Index', pos: @$, object: $1, property: $3}; }
  | method '[' exprItem ']'           { $$ = {type: 'Index', pos: @$, object: $1, property: $3}; }
  | property '[' exprItem ']'         { $$ = {type: 'Index', pos: @$, object: $1, property: $3}; }
  | index '[' exprItem ']'            { $$ = {type: 'Index', pos: @$, object: $1, property: $3}; }
  ;

/* Why cannot simplify the production of range: https://github.com/zaach/jison/issues/212 */
range
  : '[' reference '..' reference ']'  { $$ = {type: 'Range', pos: @$, start: $2, end: $4}; }
  | '[' reference '..' integer ']'    { $$ = {type: 'Range', pos: @$, start: $2, end: $4}; }
  | '[' integer '..' reference ']'    { $$ = {type: 'Range', pos: @$, start: $2, end: $4}; }
  | '[' integer '..' integer ']'      { $$ = {type: 'Range', pos: @$, start: $2, end: $4}; }
  ;

list
  : '[' exprItems ']'                 { $$ = {type: 'List', pos: @$, elements: $2}; }
  | '[' ']'                           { $$ = {type: 'List', pos: @$, elements: []}; }
  ;

map
  : '{' mapItems '}'                  { $$ = {type: 'Map', pos: @$, mapItems: $2}; }
  | '{' '}'                           { $$ = {type: 'Map', pos: @$, mapItems: []}; }
  ;

mapItems
  : mapItem                           { $$ = [$1]; }
  | mapItem ',' mapItems              { $$ = [$1].concat($3); }
  ;

mapItem
  : exprItem ':' exprItem             { $$ = {type: 'MapItem', pos: @$, property: $1, value: $3}; }
  ;


expr
  : exprItem                          { $$ = $1; }
  | '(' expr ')'                      { $$ = $2; }
  | '!' expr                          { $$ = {type: 'UnaryExpr', pos: @$, operator: $1, argument: $2}; }
  | expr '*'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '/'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '%'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '+'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '-'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '>=' expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '>'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '<=' expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '<'  expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '==' expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '!=' expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '&&' expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  | expr '||' expr                    { $$ = {type: 'BinaryExpr', pos: @$, operator: $2, left: $1, right: $3}; }
  ;

assignExpr
  : reference '=' expr                { $$ = {type: 'AssignExpr', pos: @$, left: $1, right: $3}; }
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
  | TRUE                              { $$ = {type: 'Boolean', pos: @$, value: true}; }
  | FALSE                             { $$ = {type: 'Boolean', pos: @$, value: false}; }
  | NULL                              { $$ = {type: 'Null', pos: @$, value: null}; }
  ;

integer
  : INTEGER                           { $$ = {type: 'Integer', pos: @$, value: parseInt($1)}; }
  | '-' INTEGER                       { $$ = {type: 'Integer', pos: @$, value: - parseInt($2)}; }
  ;

float
  : FLOAT                             { $$ = {type: 'Float', pos: @$, value: parseFloat($1)}; }
  | '-' FLOAT                         { $$ = {type: 'Float', pos: @$, value: - parseInt($2)}; }
  ;

dstring
  : DSTRING                           { $$ = {type: 'DString', pos: @$, value: $1.replace(/^"|"$/g, '').replace(/\\"/g, '"')}; }
  ;

string
  : STRING                            { $$ = {type: 'String', pos: @$, value: $1.replace(/^'|'$/g, '')}; }
  ;

directive
  : SET '(' assignExpr ')'                                 { $$ = $3; }
  | if                                                     { $$ = $1; }
  | FOREACH '(' reference IN reference ')' statements END  { $$ = {type: 'Foreach', pos: @$, left: $3, right: $5, body: $7}; }
  | FOREACH '(' reference IN reference ')' END             { $$ = {type: 'Foreach', pos: @$, left: $3, right: $5}; }
  | FOREACH '(' reference IN range ')' statements END      { $$ = {type: 'Foreach', pos: @$, left: $3, right: $5, body: $7}; }
  | FOREACH '(' reference IN range ')' END                 { $$ = {type: 'Foreach', pos: @$, left: $3, right: $5}; }
  | FOREACH '(' reference IN list ')' statements END       { $$ = {type: 'Foreach', pos: @$, left: $3, right: $5, body: $7}; }
  | FOREACH '(' reference IN list ')' END                  { $$ = {type: 'Foreach', pos: @$, left: $3, right: $5}; }
  | INCLUDE '(' exprItems ')'                              { $$ = {type: 'Include', pos: @$, arguments: $3}; }
  | PARSE '(' exprItem ')'                                 { $$ = {type: 'Parse', pos: @$, argument: $3}; }
  | EVALUATE '(' exprItem ')'                              { $$ = {type: 'Evaluate', pos: @$, argument: $3}; }
  | DEFINE '(' reference ')' statements END                { $$ = {type: 'Define', pos: @$, name: $3, body: $5}; }
  | DEFINE '(' reference ')' END                           { $$ = {type: 'Define', pos: @$, name: $3}; }
  | MACRO '(' ID delim macroParams ')' statements END      { $$ = {type: 'Macro', pos: @$, name: $3, arguments: $5, body: $7}; }
  | MACRO '(' ID ')' statements END                        { $$ = {type: 'Macro', pos: @$, name: $3, arguments: [], body: $5}; }
  | MACRO '(' ID delim macroParams ')' END                 { $$ = {type: 'Macro', pos: @$, name: $3, arguments: $5}; }
  | MACRO '(' ID ')' END                                   { $$ = {type: 'Macro', pos: @$, name: $3, arguments: []}; }
  | MACROCALL '(' macroCallParams ')'                      { $$ = {type: 'MacroCall', pos: @$, name: $1.replace(/^#{?|}$/g, ''), arguments: $3}; }
  | MACROCALL '(' ')'                                      { $$ = {type: 'MacroCall', pos: @$, name: $1.replace(/^#{?|}$/g, ''), arguments: []}; }
  | BMACROCALL '(' macroCallParams ')' statements END      { $$ = {type: 'MacroCall', pos: @$, name: $1.replace(/^#@{?|}$/g, ''), arguments: $3, isBlock: true, body: $5}; }
  | BMACROCALL '(' ')' statements END                      { $$ = {type: 'MacroCall', pos: @$, name: $1.replace(/^#@{?|}$/g, ''), arguments: [], isBlock: true, body: $4}; }
  | BMACROCALL '(' macroCallParams ')' END                 { $$ = {type: 'MacroCall', pos: @$, name: $1.replace(/^#@{?|}$/g, ''), arguments: $3, isBlock: true}; }
  | BMACROCALL '(' ')' END                                 { $$ = {type: 'MacroCall', pos: @$, name: $1.replace(/^#@{?|}$/g, ''), arguments: [], isBlock: true}; }
  | STOP                                                   { $$ = {type: 'Stop', pos: @$}; }
  | BREAK                                                  { $$ = {type: 'Break', pos: @$}; }
  ;

else
  : ELSE                                   { $$ = undefined; }
  | ELSE statements                        { $$ = $2; }
  ;

elseif
  : ELSEIF '(' expr ')' statements         { $$ = {type: 'If', pos: @$, test: $3, consequent: $5}; }
  | ELSEIF '(' expr ')'                    { $$ = {type: 'If', pos: @$, test: $3}; }
  | ELSEIF '(' expr ')' statements else    { $$ = {type: 'If', pos: @$, test: $3, consequent: $5, alternate: $6}; }
  | ELSEIF '(' expr ')' else               { $$ = {type: 'If', pos: @$, test: $3, alternate: $5}; }
  | ELSEIF '(' expr ')' statements elseif  { $$ = {type: 'If', pos: @$, test: $3, consequent: $5, alternate: $6}; }
  | ELSEIF '(' expr ')' elseif             { $$ = {type: 'If', pos: @$, test: $3, alternate: $6}; }
  ;

if
  : IF '(' expr ')' statements END         { $$ = {type: 'If', pos: @$, test: $3, consequent: $5}; }
  | IF '(' expr ')' END                    { $$ = {type: 'If', pos: @$, test: $3}; }
  | IF '(' expr ')' statements else END    { $$ = {type: 'If', pos: @$, test: $3, consequent: $5, alternate: $6}; }
  | IF '(' expr ')' else END               { $$ = {type: 'If', pos: @$, test: $3,  alternate: $5}; }
  | IF '(' expr ')' statements elseif END  { $$ = {type: 'If', pos: @$, test: $3, consequent: $5, alternate: $6}; }
  | IF '(' expr ')' elseif END             { $$ = {type: 'If', pos: @$, test: $3, alternate: $5}; }
  ;

macroParams
  : reference                              { $$ = [$1]; }
  | reference delim macroParams            { $$ = [$1].concat($3); }
  ;
  
macroCallParams
  : exprItem                               { $$ = [$1]; }
  | exprItem delim macroCallParams         { $$ = [$1].concat($3); }
  ;

delim
  : WS
  | ','
  ;

