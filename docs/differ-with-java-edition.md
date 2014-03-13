# Differ From Java Edition(v1.6.x ~ v1.7)

Source Code | Expect | Actual | Suggestion
----------- | ------ | -------|
\$a | <ref, \$a> | <text, \$a> |
$\!a | <ref, $\!a> | <text, $\!a> |
$a(...) | <ref, $a> <text, (...)> | syntax error | ${a}(...)
$a.b\[0\](...) | <ref, $a.b[0]> <text, (...)> | syntax error | ${a.b[0]}(...)
$a.b(c) | <ref, $a.b> <'('> <ref, c> <')'> | syntax error | $a.b($.c)
