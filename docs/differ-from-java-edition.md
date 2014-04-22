# Differ From Java Edition(v1.6.x ~ v1.7)

## Syntax

Source Code | Java   | Node   | Suggestion
----------- | ------ | -------|------------
\$a | <text, $a>(v1.6.x)<br/><ref, \$a>(v1.7) | <text, \$a> |
$\!a | <text, $!a>(v1.6.x)<br/><ref, $\\!a>(v1.7) | <text, $\\!a> |
$a(...) | <ref, $a> <text, (...)> | illegal | ${a}(...)
$a.b\[0\](...) | <ref, $a.b[0]> <text, (...)> | illegal | ${a.b[0]}(...)
$a.b(c) | <ref, $a.b> <'('> <ref, c> <')'> | illegal | $a.b($c)
$a.b(c.d) | illegal | illegal | $a.b($c.d)
macro name:<br/>a--b| illegal | legal |
marcro name: <br/>a-_b<br/>a__b<br/>a1 | legal | legal
\#set($a={'k':'v'})<br/>\#set($a.b.c = 1) | $a.b = 1<br/>$a.b.c = undefined | do nothing |
\#macro(name $arg=default) | legal(v1.6.x)<br/>illegal<v1.7> | illegal | no default value
\#include($a $b) | legal | illegal | \#include($a, $b)
\#include($a, $b) | legal | legal |
null | legal(v1.6.x)<br/>illegal(v1.7) | legal |
!null | illegal | true |

## Method look up

If the method is not found, node `velocity` will look up possible value follow rules below.

#### String length

```
$string.length() -> string.length
```

#### Array or map

```
$array.size() -> array.length
$array.isEmpty() -> !array.length
$array.get(idx) -> array[idx]
$array.set(idx, value)  -> array[idx] = value

$map.get(key) -> map[property]
$map.set(key, value) -> map[key] = value
$map.keySet() -> Object.keys(map)
$map.entrySet() -> Object.keys(map).map(function(key){return {key: key, value: map[key]}})
```

#### Get property

```
$obj.getName() -> obj.name
$obj.getname() -> obj.name
$obj.get('name') -> obj.name
$obj.isName() -> !!obj.name
```

###### NOTE: node `velocity` won't see if there is possible method when meets property.