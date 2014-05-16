# velocity

A node velocity template engine.

Node 版 velocity 模板引擎。

[Differ from Java edition](https://github.com/fool2fish/velocity/blob/master/docs/differ-from-java-edition.md)

[Bug and suggestion](https://github.com/fool2fish/velocity/issues/new)

---

## 0. Features

- Full implementation of velocity syntax.
- View template dependencies.
- View data structure of references in templates.

## 1. Installment

```sh
$ npm install velocity -g
```

## 2. Quick Start

An example is ready for you:

```sh
$ git clone https://github.com/fool2fish/velocity.git
$ cd examples
```

### Render a template

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root1/index.vm --context ./context.js
```

Output:

```
>>>index.vm
>>>ref.vm
ID: 00000001
Name: fool2fish fool2fish fool2fish
...
```

### Start a simple HTTP server

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root1/index.vm --context ./context.js --server
```

Then you can visit `localhost:6789` in browser to see the result.

### View dependencies

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root1/index.vm
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

### View reversed dependencies

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root2/uisvr.vm --reverse
```
Output:

```
|-uisvr.vm
  |-direc.vm
    |-index.vm
```

### Extract data structure from template

[Detailed document](https://github.com/fool2fish/velocity/issues/8)

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root1/index.vm --data
```

Output:

```
{ id: '',
  user: { name: '', nick: '', github: '', favorites: [ '' ] },
  method: { foo: [Function], bar: [Function] },
  nonexist: { property: { method: [Function] } },
  ...
```

### Extract data structure from template and save to file

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root1/index.vm --data --output data-structure.js
```

### Mix existed data into data structure

Command:

```sh
$ velocity --root ./root1,./root2,./root3 --macro ./global-macro/macro.vm --template ./root1/index.vm --context ./partial-context.js --data
```

Output:

```
{ id: '00000001',
  user:
   { name: 'fool2fish',
     favorites: [ 'food', 'travel', 'comic', '...' ],
     undefinedIsPreserved: undefined,
     nick: '',
     github: '' },
     ...
```

## 3. Use In Modules

### Render a template

```js
var Engine = require('velocity').Engine
var engine = new Engine( {{options}} )
var result = engine.render( {{context}} )
console.log(result)
```

### Get the AST

```js
var parser = require('velocity').parser
var content = fs.readFileSync( {{path/to/template}} , {encoding: var ast = parser.parse(content)
console.log(ast)
```

### Extract data structure from template and save to file

```js
var Data = require('velocity').Data
var data = new Data({
  output: 'path/save/data/structure',
  ...
})
var reselt = data.extract({{optional existed context}})
```

## 4. Options

You can set a global config (in JSON format):

```sh
$ velocity config
```

All options are very simple, you can view them in terminal:

```sh
$ velocity -h
```
