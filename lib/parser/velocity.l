/*
 * Start conditions
 * r  - reference
 * wr - reference wrapped by braces
 * b  - brackets
 * p  - parentheses
 * m  - map
 */
 
%x  r wr b p m

A   [a-zA-Z]
ID  [a-zA-Z][a-zA-Z0-9-_]*
DP  [ \t]*\(

%%

("\$"|"\#"|[^\$\#])+                {                        return 'CONTENT'; }
"##".*                              {                        return 'SCOMMENT'; }
"#*"[\s\S]*?"*#"                    {                        return 'MCOMMENT'; }
"#[["[\s\S]*?"]]#"                  {                        return 'UNPARSED_CONTENT'; }

<INITIAL,m,b,p>\$\!?{ID}            { this.pushState('r');   return 'ID'; }
<INITIAL,m,b,p>\$\!?\{{ID}          { this.pushState('wr');  return 'WID'; }

<r>\.{ID}(?!\.{A}|\[|\()            { this.popState();       return 'ATTR'; }
<r,wr>\.{ID}                        {                        return 'ATTR'; }
<r,wr>"["                           { this.pushState('b');   return yytext; }
<b>"]"                              { this.popState();       return yytext; }
<r,wr>"("                           { this.pushState('p');   return yytext; }
<p>")"                              { this.popState();       return yytext; }
<b,p>"{"                            { this.pushState('m');   return yytext; }
<wr,m>"}"                           { this.popState();       return yytext; }
<r>""                               { this.popState(); }

"#"("{set}"|"set"){DP}              { this.pushState('p');   return 'SET'; }
"#"("{if}"|"if"){DP}                { this.pushState('p');   return 'IF'; }
"#"("{elseif}"|"elseif"){DP}        { this.pushState('p');   return 'ELSEIF'; }
"#"("{else}"|"else"(?!{A}))         {                        return 'ELSE'; }
"#"("{end}"|"end"(?!{A}))           {                        return 'END'; }
"#"("{foreach}"|"foreach"){DP}      { this.pushState('p');   return 'FOREACH';}
"#"("{include}"|"include"){DP}      { this.pushState('p');   return 'INCLUDE'; }
"#"("{parse}"|"parse"){DP}          { this.pushState('p');   return 'PARSE'; }
"#"("{stop}"|"stop"(?!{A}))         {                        return 'STOP'; }
"#"("{break}"|"break"(?!{A}))       {                        return 'BREAK'; }
"#"("{evaluate}"|"evaluate"){DP}    { this.pushState('p');   return 'EVALUATE'; }
"#"("{define}"|"define"){DP}        { this.pushState('p');   return 'DEFINE'; }
"#"("{macro}"|"macro"){DP}          { this.pushState('p');   return 'MACRO'; }
"#"(\{{A}+\}|{A}+){DP}              { this.pushState('p');   return 'MACROCALL'; }
"#@"(\{{A}+\}|{A}+){DP}             { this.pushState('p');   return 'BMACROCALL'; }


<m,b,p>\s+                          { /*ignore whitespace*/ }
<m>":"                              {                        return yytext; }
<m,b,p>","                          {                        return yytext; }
<b>".."                             {                        return 'RANGE'; }
<p>"in"                             {                        return 'IN'; }

<m,b,p>"true"|"false"|"null"        {                        return yytext.toUpperCase(); }
<m,b,p>"=="|"!="|">="|"<="|">"|"<"  {                        return yytext; }
<m,b,p>"&&"|"||"|"!"                {                        return yytext; }
<m,b,p>[\+\-\*\/\%]                 {                        return yytext; }
<m,b,p>"="                          {                        return yytext; }

<m,b,p>\d+\.\d+                     {                        return 'FLOAT'; }
<m,b,p>\d+                          {                        return 'INTEGER'; }

<m,b,p>\"(\\\"|[^\"])*\"            {                        return 'DSTRING'; }
<m,b,p>\'(\\\'|[^\'])*\'            {                        return 'SSTRING'; }


[\$\#]                              {                        return 'CONTENT'; }
















