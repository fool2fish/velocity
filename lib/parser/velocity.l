/*
 * Start conditions
 * $obj.method<method>(<call> ... )<INITIAL>
 * ${obj.method<wmethod>(<wcall> ...)}<INITIAL>
 * #{set}<set>(<inset>)<INITIAL>
 * #{if}<if>(<inif>)<INITIAL>
 */
%x method call wmethod wcall set inset

/*
 * Definitions
 */
ID  [a-zA-Z][a-zA-Z0-9-_]*

%%

"##".*              { yytext = yytext.replace(/^##/, '');
                      return 'SCOMMENT'; }
"#*"[\s\S]*?"*#"    { yytext = yytext.replace(/^#\*|\*#$/g, '');
                      return 'MCOMMENT'; }
"#[["[\s\S]*?"]]#"  { yytext = yytext.replace(/^#\[\[|\]\]#$/g, '');
                      return 'UNPARSED_CONTENT'; }


"$"\{?{ID}(\.{ID})+/\s*"("  {
                      this.pushState(yytext[1] == '{' ? wmethod : method);
                      yytext = yytext.replace(/\$\{?/, '');
                      return 'METHOD';
                    }

<wmethod>\s*"("     { this.popState();
                      this.pushState(wcall);
                      return '(';}

<wcall>")}"         { this.popState();
                      return ')';}

<method>\s*"("      { this.popState();
                      this.pushState(call);
                      return '(';}

<call>")"           { this.popState();
                      return ')';}

"$"\!?({ID}|"{"{ID}"}")  {
                      yytext = yytext.replace(/^\$!?{?|}$/g, '');
                      return 'VARIABLE';
                    }

"$"({ID}(\.{ID})+|"{"{ID}(\.{ID})+"}")  {
                      yytext = yytext.replace(/^\${?|}$/g, '');
                      return 'PROPERTY'
                    }

"#"(set|{set})/\s*"("  {
                      this.pushState(set)
                      return 'SET'
                    }

<set>\s*"("         { this.popState();
                      this.pushState(inset);
                      return '(';}

<inset>")"          { this.popState();
                      return ')';}
                      
"#"(if|{if})/\s*"("  {
                      this.pushState(if)
                      return 'IF'
                    }

<if>\s*"("          { this.popState();
                      this.pushState(inif);
                      return '(';}

<inif>")"           { this.popState();
                      return ')';}
%%














%%