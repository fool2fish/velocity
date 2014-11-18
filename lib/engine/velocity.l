/*
 * Start conditions
 * rp - reference prefix
 * rw - reference wrapper
 * r  - reference
 * b  - brackets
 * bpm- before left parenthesis of macro
 * bp - before left parenthesis
 * pm - parantheses of macro
 * p  - parentheses
 * m  - map
 */
 
%x  rp rw r b bpm bp pm p m

A   [a-zA-Z0-9-_]
ID  [a-zA-Z_][a-zA-Z0-9-_]*
LP  (?=[ \t]*\()

%%

("\$"|"\#"|[^\$\#])+                {                        return 'TEXT'; }
"#[["[\s\S]*?"]]#"                  {                        return 'BTEXT'; }
"##".*                              {                        return 'COMMENT'; }
"#*"[\s\S]*?"*#"                    {                        return 'BCOMMENT'; }


<INITIAL,m,b,p,pm>\$(?=\!?\{?{ID})  { this.pushState('rp');  return yytext; }
<rp>"!"                             {                        return yytext; }
<rp>"{"                             { this.popState();
                                      this.pushState('rw');  return yytext; }
<rp>{ID}                            { this.popState();
                                      this.pushState('r');   return 'ID'; }
<rw>{ID}                            { this.pushState('r');   return 'ID'; }

<r>"."{ID}                          {                        return 'PROP'; }
<r,m,b,p,pm>"["                     { this.pushState('b');   return yytext; }
<b>"]"                              { this.popState();       return yytext; }
<r,m,b,p,pm>"("                     { this.pushState('p');   return yytext; }
<p>")"                              { this.popState();       return yytext; }
<m,b,p,pm>"{"                       { this.pushState('m');   return yytext; }
<rw,m>"}"                           { this.popState();       return yytext; }
<r><<EOF>>                          { this.popState();       return 'EOF'; }
<r>""                               { this.popState(); }


<m,b,p>\s+                          { /*ignore whitespace and \n*/ }
<m>":"                              {                        return yytext; }
<m,b,p>","                          {                        return yytext; }
<b>".."                             {                        return yytext; }
<p>"in"                             {                        return 'IN'; }

<m,b,p,pm>"true"|"false"|"null"     {                        return yytext.toUpperCase(); }
<m,b,p>"=="|"!="|">="|"<="|">"|"<"  {                        return yytext; }
<m,b,p>"&&"|"||"|"!"                {                        return yytext; }
<m,b,p>[\+\-\*\/\%]                 {                        return yytext; }
<m,b,p>"="                          {                        return yytext; }

<m,b,p,pm>\d+\.\d+                  {                        return 'FLOAT'; }
<m,b,p,pm>\d+                       {                        return 'INTEGER'; }

<m,b,p,pm>\"(\\\"|[^\"])*\"         {                        return 'DSTRING'; }
<m,b,p,pm>\'(\\\'|[^\'])*\'         {                        return 'STRING'; }


"#"("{set}"|"set"){LP}              { this.pushState('bp');  return 'SET'; }
"#"("{if}"|"if"){LP}                { this.pushState('bp');  return 'IF'; }
"#"("{elseif}"|"elseif"){LP}        { this.pushState('bp');  return 'ELSEIF'; }
"#"("{else}"|"else"(?!{A}))         {                        return 'ELSE'; }
"#"("{end}"|"end"(?!{A}))           {                        return 'END'; }
"#"("{foreach}"|"foreach"){LP}      { this.pushState('bp');  return 'FOREACH';}
"#"("{include}"|"include"){LP}      { this.pushState('bp');  return 'INCLUDE'; }
"#"("{parse}"|"parse"){LP}          { this.pushState('bp');  return 'PARSE'; }
"#"("{stop}"|"stop"(?!{A}))         {                        return 'STOP'; }
"#"("{break}"|"break"(?!{A}))       {                        return 'BREAK'; }
"#"("{evaluate}"|"evaluate"){LP}    { this.pushState('bp');  return 'EVALUATE'; }
"#"("{define}"|"define"){LP}        { this.pushState('bp');  return 'DEFINE'; }
"#"("{macro}"|"macro"){LP}          { this.pushState('bpm'); return 'MACRO'; }
"#"(\{{ID}\}|{ID}){LP}              { this.pushState('bpm'); return 'MACROCALL'; }
"#@"(\{{ID}\}|{ID}){LP}             { this.pushState('bpm'); return 'BMACROCALL'; }

<bp>[ \t]*"("                       { this.popState();
                                      this.pushState('p');   return '('; }
<bpm>[ \t]*"("\s*                   { this.popState();
                                      this.pushState('pm');  return '(';}
<pm>{ID}                            {                        return 'ID'; }
<pm>\s*","\s*                       {                        return ','; }
<pm>\s*")"                          { this.popState();       return ')'; }
<pm>\s+                             {                        return 'WS'; }

[\$\#]                              {                        return 'TEXT'; }
<<EOF>>                             {                        return 'EOF'; }















