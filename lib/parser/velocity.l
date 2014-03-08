/*
 * Start conditions
 * r  - reference
 * wr - reference wrapped by braces
 * d  - dierctive
 * wd - directive wrapped by braces
 * b  - brackets
 * p  - parentheses
 * ds - literal wrapped by double quotes
 * ss - literal warpped by single quotes
 */
 
%x 

/*
 * Definitions
 */
A   [a-zA-Z]
ID  [a-zA-Z][a-zA-Z0-9-_]*

%%

(\\\$|\\#|[^\$#]|\$(?!{A}|\!{A}|\{{A}|\!\{{A})|#(?!{A}|\{{A}|@{A}|\{@{A}|#|\*|\[\[))+  { 
                      yytext = yytext.replace(/\\(\$|#)/g, '$1');
                      return 'CONTENT'; }


"##".*              { return 'SCOMMENT'; }
"#*"[\s\S]*?"*#"    { return 'MCOMMENT'; }
"#[["[\s\S]*?"]]#"  { return 'UNPARSED_CONTENT'; }


"$"/{A}             { this.pushState('r');
                      return yytext; }
"$"/[!{]            { this.pushState('dollar');
                      return yytext; }
<dollar>"!"/{A}     { this.popState();
                      this.pushState('r');
                      return yytext; }
<dollar>"!"/"{"     { this.popState();
                      this.pushState('silent');
                      return yytext; }
<dollar,silent>"{"  { this.popState(); 
                      this.pushState('wr');
                      return yytext; }

<r,wr>{ID}          { return 'ID'; }
<r,wr>\.{ID}        { return 'ATTR'; }
<r,wr>"["           { this.pushState('b');
                      return yytext; }
<r,wr>"("           { this.pushState('p');
                      return yytext; }
<r>[\s\S]           { this.popState();
                      return 'CONTENT'; }
<wr>"}"             { this.popState();
                      return '}'; }




"#"                 { this.pushState('d);
                      return yytext; }

%%














