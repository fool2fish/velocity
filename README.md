# vmx

A node velocity template engine and dependency analyser.

Node 版 velocity 模板引擎和依赖分析。

---

Latest stable version: v0.2.x

[Differ from Java edition](https://github.com/fool2fish/vmx/blob/master/docs/differ-from-java-edition.md)

[Bug and suggestion](https://github.com/fool2fish/vmx/issues/new)


## 1. Installment

```
$ npm install vmx -g
```

## 2. Quick Start

I had prepared a example for you:

```
$ git clone https://github.com/fool2fish/vmx.git
$ cd examples
```

#### Render a template

Command:

```
$ vmx -root ./root1,./root2,./root3 -macro ./global-macro/macro.vm -template ./root1/index.vm -context ./context.js
```

Output:

```
>>>index.vm
>>>ref.vm
ID: 00000001
Name: fool2fish fool2fish fool2fish
Name length: 9
Nick:  ${user.nick}
Github: https://github.com/fool2fish
...
```

#### View dependencies

Command:

```
$ vmx -root ./root1,./root2,./root3 -macro ./global-macro/macro.vm -template ./root1/index.vm
```
Output:

```
|-index.vm
  |-/ref.vm
  |-/direc.vm
  | |-/plain-text.txt
  | |-/cms.vm
  | |-/uisvr.vm
  |-/expr.vm
```

#### View reversed dependencies

Command:

```
$ vmx -root ./root1,./root2,./root3 -macro ./global-macro/macro.vm -template ./root2/uisvr.vm --reverse
```
Output:

```
|-uisvr.vm
  |-direc.vm
    |-index.vm
```

## 3. Use In Modules

#### Render a template

```
var Engine = require('vmx').Engine
try {
  var engine = new Engine( {{options}} )
  var result = engine.render( {{context}} )
  if (result.success) {
    console.log(result.value)
  } else {
    console.log(result)
  }
} catch (e) {
  console.log(e)
}

```

**If it failed, you may get a result like this:**

```
{
  "success": false,
  "message": "Error message.",
  "stack": [
    [template, position],
    ...
  ],
  "lines": [
    "Lines caused the error."
  ],
  "pos": {
    "first_line": 7, "last_line": 7,
    "first_column": 27, "last_column": 40
  }
}
```

#### Get the AST

```
var parser = require('vmx').parser
var content = fs.readFileSync( {{path/to/template}} , {encoding: {{encoding}} })
var ast = parser.parse(content)
console.log(ast)
```

## 4. Options

```
vmx -h
```

