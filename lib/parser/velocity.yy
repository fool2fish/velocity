{

}

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
  : '$' '!' ID
  | '$' '!' '{' ID '}'
  | '$' ref
  | '$' '{' ref '}'
  ;

ref
  : ID
  | ref '.' ID
  | ref index
  | call
  ;


range
  : '[' rangeItem '..' rangeItem ']'
  

map
  : '{' mapItems '}'
  | '{' '}'
  ;

mapItems
  : mapItem
  | mapItems ',' mapItem
  ;


string
  : DSTRING
  | SSTRING
  ;












