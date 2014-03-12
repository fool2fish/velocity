/*
 * Start conditions
 * rp - reference prefix
 * rw - reference wrapper
 * r  - reference
 * b  - brackets
 * bp - before left parenthesis
 * p  - parentheses
 * m  - map
 */
 
%x  rp rw r b bp p m

A   [a-zA-Z]
ID  [a-zA-Z][a-zA-Z0-9-_]*
LP  (?=[ \t]*\()

%%

("\$"|"\#"|[^\$\#])+                {                        return 'TEXT'; }
"#[["[\s\S]*?"]]#"                  {                        return 'BTEXT'; }
"##".*                              {                        return 'COMMENT'; }
"#*"[\s\S]*?"*#"                    {                        return 'BCOMMENT'; }


<INITIAL,m,b,p>\$(?=\!?\{?{ID})     { this.pushState('rp');  return yytext; }
<rp>"!"                             {                        return yytext; }
<rp>"{"                             { this.popState();
                                      this.pushState('rw');  return yytext; }
<rp>{ID}                            { this.popState();
                                      this.pushState('r');   return 'ID'; }
<rw>{ID}                            { this.pushState('r');   return 'ID'; }

<r>"."                              {                        return yytext; }
<r>{ID}                             {                        return 'ID'; }
<r,m,b,p>"["                        { this.pushState('b');   return yytext; }
<b>"]"                              { this.popState();       return yytext; }
<r,m,b,p>"("                        { this.pushState('p');   return yytext; }
<p>")"                              { this.popState();       return yytext; }
<m,b,p>"{"                          { this.pushState('m');   return yytext; }
<rw,m>"}"                           { this.popState();       return yytext; }
<r>""                               { this.popState(); }


<m,b,p>\s+                          { /*ignore whitespace*/ }
<m>":"                              {                        return yytext; }
<m,b,p>","                          {                        return yytext; }
<b>".."                             {                        return yytext; }
<p>"in"                             {                        return 'IN'; }

<m,b,p>"true"|"false"|"null"        {                        return yytext.toUpperCase(); }
<m,b,p>"=="|"!="|">="|"<="|">"|"<"  {                        return yytext; }
<m,b,p>"&&"|"||"|"!"                {                        return yytext; }
<m,b,p>[\+\-\*\/\%]                 {                        return yytext; }
<m,b,p>"="                          {                        return yytext; }

<m,b,p>\d+\.\d+                     {                        return 'FLOAT'; }
<m,b,p>\d+                          {                        return 'INTEGER'; }

<m,b,p>\"(\\\"|[^\"])*\"            {                        return 'DSTRING'; }
<m,b,p>\'(\\\'|[^\'])*\'            {                        return 'STRING'; }


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
"#"("{macro}"|"macro"){LP}          { this.pushState('bp');  return 'MACRO'; }
"#"(\{{A}+\}|{A}+){LP}              { this.pushState('bp');  return 'MACROCALL'; }
"#@"(\{{A}+\}|{A}+){LP}             { this.pushState('bp');  return 'BMACROCALL'; }

<bp>[ \t]+                          { /*ignore whitespace*/ }
<bp>"("                             { this.popState();
                                      this.pushState('p');   return yytext; }


[\$\#]                              {                        return 'TEXT'; }
















