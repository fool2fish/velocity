# velocity

A node velocity template engine.

Node 版 velocity 模板引擎。

[Differ from Java edition](https://github.com/fool2fish/velocity/blob/master/docs/differ-from-java-edition.md)

[Bug and suggestion](https://github.com/fool2fish/velocity/issues/new)

---

## 0. Features

- Full implementation of velocity syntax.
- View template dependencies.
- Extract data structure from templates.

## 1. Installment

```
$ npm install velocity -g
```

## 2. Quick Start

Some examples are ready for you:

```
$ git clone https://github.com/fool2fish/velocity.git
$ cd examples
```

#### Try a simple one

Command:

```
$ cd hello
$ velocity
```

Output:

```
Hello, velocity!
```

#### More examples

- [Diagnose error](https://github.com/fool2fish/velocity/tree/master/examples/errors)
- [Method lookup](https://github.com/fool2fish/velocity/tree/master/examples/method-lookup)
- [View dependencies](https://github.com/fool2fish/velocity/tree/master/examples/dependency)
- [Extract data structure from template](https://github.com/fool2fish/velocity/tree/master/examples/data-structure)
- [Start a simple http server](https://github.com/fool2fish/velocity/tree/master/examples/server)

See all [examples](https://github.com/fool2fish/velocity/tree/master/examples).


## 3. Use In Modules

### Render a template

```
var Engine = require('velocity').Engine
var engine = new Engine( {{options}} )
var result = engine.render( {{context}} )
console.log(result)
```

### Get the AST

```
var parser = require('velocity').parser
var content = fs.readFileSync( {{path/to/template}} , {encoding: {{encoding}})
var ast = parser.parse(content)
console.log(ast)
```

### Extract data structure from template and save to file

```
var Data = require('velocity').Data
var data = new Data({
  output: 'path/save/data/structure',
  ...
})
var reselt = data.extract({{optionalExistedContext}})
```

## 4. Options

All options are very simple, you can view them in terminal:

```
$ velocity -h
```
Option `config` specifies a config file path. All [examples](https://github.com/fool2fish/velocity/tree/master/examples) have a config file.



