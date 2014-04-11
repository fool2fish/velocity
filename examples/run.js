var fs = require('fs')
var util = require('util')

var Engine = require('../lib/engine')
var parser = require('../lib/engine/velocity')
var lexicalParser = require('../lib/engine/lex')
var dep = require('../lib/dep')

var action = 'render'
process.argv.forEach(function(item, idx, list) {
  if (item in {ast: true, tokens: true, dep: true}) action = item
})

var file = './root1/index.vm'
var content = fs.readFileSync(file, {encoding: 'utf8'})

var cfg = {
  root: ['root1', 'root2', 'root3'],
  template: file,
  macro: './global-macro/macro.vm'
}

if (action === 'dep') {
  dep(cfg)

} else if (action === 'tokens') {
  var tokens = lexicalParser.parse(content)
  console.log(util.inspect(tokens, {depth: null}))

} else if (action === 'ast') {
  var ast = parser.parse(content)
  console.log(util.inspect(ast, {depth: null}))

} else {
  var context = require('./context')

  var engine = new Engine(cfg)
  try {
    var result = engine.render(context)
    console.log(result)
  } catch (e) {
    console.log(e.stack)
  }
}


