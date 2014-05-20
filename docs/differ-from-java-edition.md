# Differ From Java Edition(v1.6.x ~ v1.7)

## Syntax

Source Code | Java   | Node   | Suggestion
----------- | ------ | -------|------------
\$a | text: $a(v1.6.x)<br/>ref: \$a(v1.7) | text: \$a |
$\!a | <text, $!a>(v1.6.x)<br/><ref, $\\!a>(v1.7) | <text, $\\!a> |
$a(...) | <ref, $a> <text, (...)> | illegal | ${a}(...)
$a.b\[0\](...) | <ref, $a.b[0]> <text, (...)> | illegal | ${a.b[0]}(...)
$a.b(c) | <ref, $a.b> <'('> <ref, c> <')'> | illegal | $a.b($c)
$a.b(c.d) | illegal | illegal | $a.b($c.d)
$map.put(k, v) | illegal(v1.6.x) <br/> legal(v1.7) | illegal |
$map['key'] | illegal(v1.6.x) <br/> legal(v1.7) | legal |
$list.get(0) | illegal(v1.6.x) <br/> legal(v1.7) | legal |
macro name:<br/>a--b| illegal | legal |
marcro name: <br/>a-_b<br/>a__b<br/>a1 | legal | legal
\#set($a.b = 1) | legal | illegal | left hand of assignment expression must be an id
\#set($a={})<br/>\#set($a.b.c=1) | $a.b=1<br/>$a.b.c=undefined | illegal |
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

$map.get(key) -> map[property]
$map.keySet() -> Object.keys(map)
$map.entrySet() -> Object.keys(map).map(function(key){return {key: key, value: map[key]}})

// below are not supported
$array.set(idx, value)
$array.setIdx(value)
$map.set(key, value)
$map.setKey(value)
$map.put(key, value)
$map.putKey(value)
```

#### Get property

```
$obj.isName() -> !!obj.name
$obj.getName() -> obj.name
$obj.getname() -> obj.name
$obj.get('name') -> obj.name
```

###### NOTE: node `velocity` won't see if there is possible method when meets property.