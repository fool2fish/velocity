# velocity

[![Build Status](https://secure.travis-ci.org/fool2fish/velocity.png?branch=master)](http://travis-ci.org/fool2fish/velocity)

[![NPM](https://nodei.co/npm/velocity.png?downloads=true&stars=true)](https://nodei.co/npm/velocity/)

A node velocity template engine.

Node 版 velocity 模板引擎。

[Differ from Java edition](https://github.com/fool2fish/velocity/blob/master/docs/differ-from-java-edition.md)

[Bug and suggestion](https://github.com/fool2fish/velocity/issues/new)

[Change log](https://github.com/fool2fish/velocity/releases)

---

## 0. Features

- Full implementation of velocity syntax.
- View template dependencies.
- Extract data structure from templates.
- Generate intermediate template to dump the context.

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
- [Generate intermediate template to dump the context](https://github.com/fool2fish/velocity/tree/master/examples/data-dump)
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

## License

(The MIT License)

Copyright (c) 2014 fool2fish <fool2fish@gmail.com> and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
