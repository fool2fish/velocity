/*
 * Start conditions
 */
 
%x 

/*
 * Definitions
 */
A   [a-zA-Z]
ID  [a-zA-Z][a-zA-Z0-9-_]*

%%

(\\\$|\\#|[^\$#]|\$(?!{A}|\!{A}|\{{A}|\!\{{A})|#(?!{A}|\{{A}))+  { 
                      yytext = yytext.replace(/\\(\$|#)/g, '$1');
                      return 'CONTENT'; }

"##".*              { return 'SCOMMENT'; }
"#*"[\s\S]*?"*#"    { return 'MCOMMENT'; }
"#[["[\s\S]*?"]]#"  { return 'UNPARSED_CONTENT'; }


%%














