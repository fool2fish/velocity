# Differ From Java Edition(v1.6.x ~ v1.7)

Source Code | Expect | Actual | Suggestion
----------- | ------ | -------|
\$a | <text, $a>(v1.6.x)<br/><ref, \$a>(v1.7) | <text, \$a> |
$\!a | <text, $!a>(v1.6.x)<br/><ref, $\\!a>(v1.7) | <text, $\\!a> |
$a(...) | <ref, $a> <text, (...)> | illegal | ${a}(...)
$a.b\[0\](...) | <ref, $a.b[0]> <text, (...)> | illegal | ${a.b[0]}(...)
$a.b(c) | <ref, $a.b> <'('> <ref, c> <')'> | illegal | $a.b($c)
$a.b(c.d) | illegal | illegal | $a.b($c.d)
macro name:<br/>a--b| illegal | legal |
marcro name: <br/>a-_b<br/>a__b<br/>a1 | legal | legal
\#include($a $b) | legal | illegal | \#include($a, $b)
\#include($a, $b) | legal | legal |
