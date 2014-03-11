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
  | /* epsilon */          { return []; }
  ;

statements
  : statement              { $$ = [$1]; }
  | statements statement   { $$ = $1.concat($2); }
  ;

statement
  : CONTENT                { $$ = {type: 'Content', body: $1.replace(/\\([\$#])/g, '$1')}; }
  | UNPARSED_CONTENT       { $$ = {type: 'UnparsedContent', body: $1.replace(/^#\[\[|\]\]#/g, '')}; }
  | SCOMMENT               { $$ = {type: 'Scomment', body: $1.replace(/^##/, '')}; }
  | BCOMMENT               { $$ = {type: 'Bcomment', body: $1.replace(/^#\*|\*#$/g, '')}; }
  | reference              { $$ = $1; }
  | directive              { $$ = $1; }
  ;

reference
  : ref                    { $$ = $1; }
  | wref '}'               { $$ = $1; }
  ;

ref
  : ID                     { $$ = {type: 'Identifier', name: $1.replace(/^\$!?/, '')}; }
  | ref refConsequent
  ;

wref
  : WID                    { $$ = {type: 'Identifier', name: $1.replace(/^\$!?{/, '')}; }
  | wref refConsequent
  ;

refConsequent
  : ATTR                   { $$ = {type: 'Identifier', name: $1.replace(/^\./, '')}; }
  | index                  { $$ = $1; }
  | call                   { $$ = $1; }
  ;

























