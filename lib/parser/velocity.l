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

%%

(\\\$|\\#|[^\$#])+              {                         return 'CONTENT'; }
##.*                            {                         return 'SCOMMENT'; }
#\*[\s\S]*?\*#                  {                         return 'MCOMMENT'; }
#\[\[[\s\S]*?\]\]#              {                         return 'UNPARSED_CONTENT'; }


<INITIAL,m,b,p>\$!?{ID}         { this.pushState(r);      return 'ID'; }
<INITIAL,m,b,p>\$!?{{ID}        { this.pushState(wr);     return 'WID'; }

<r,wr>\.{ID}                    {                         return 'ATTR'; }
<r,wr>"["                       { this.pushState(b);      return yytext; }
<b>"]"                          { this.popSatate();       return yytext; }
<r,wr>"("                       { this.pushState(p);      return yytext; }
<p>")"                          { this.popSatate();       return yytext; }
<b,p>"{"                        { this.pushState(m);      return yytext; }
<wr,m>"}"                       { this.popState();        return yytext; }
<r>[\s\S]                       { this.popState();        return 'CONTENT'; }


#({set}|set)\s*\(               { this.pushState(p);      return 'SET'; }
#({if}|if)\s*\(                 { this.pushState(p);      return 'IF'; }
#({elseif}|elseif)\s*\(         { this.pushState(p);      return 'ELSEIF'; }
#({else}|else(?!{A}))           {                         return 'ELSE'; }
#({end}|end(?!{A}))             {                         return 'END'; }
#({foreach}|foreach)\s*\(       { this.pushState(p);      return 'FOREACH';}
#({include}|include)\s*\(       { this.pushState(p);      return 'INCLUDE'; }
#({parse}|parse)\s*\(           { this.pushState(p);      return 'PARSE'; }
#({stop}|stop(?!{A}))           {                         return 'STOP'; }
#({break}|break(?!{A}))         {                         return 'BREAK'; }
#({evaluate}|evaluate)\s*\(     { this.pushState(p);      return 'EVALUATE'; }
#({define}|define)\s*\(         { this.pushState(p);      return 'DEFINE'; }
#({macro}|macro)\s*\(           { this.pushState(p);      return 'MACRO'; }
#({{A}+}|{A}+)\s*\(             { this.pushState(p);      return 'MACROCALL'; }
#@({{A}+}|{A}+)\s*\(            { this.pushState(p);      return 'BMACROCALL'; }


<m,b,p>\s+                      { /*ignore whitespace*/ }
<m>":"                          {                         return yytext; }
<m,b,p>","                      {                         return yytext; }
<b>".."                         {                         return 'RANGE'; }
<p>"in"                         {                         return 'IN'; }

<m,b,p>true|false|null          {                         return yytext.toUpperCase(); }
<m,b,p>==|!=|>=|<=|>|<          {                         return yytext; }
<m,b,p>&&|\|\||!                {                         return yytext; }
<m,b,p>[\+\-\*\/%]              {                         return yytext; }
<m,b,p>=                        {                         return yytext; }

<m,b,p>\d+\.\d+                 {                         return 'FLOAT'; }
<m,b,p>\d+                      {                         return 'INTEGER'; }

<m,b,p>\"(\\\"|[^\"])*\"        {                         return 'DSTRING'; }
<m,b,p>\'(\\\'|[^\'])*\'        {                         return 'SSTRING'; }


[\$#]                           {                         return 'CONTENT'; }
<<EOF>>                         {                         return 'EOF'; }
%%














