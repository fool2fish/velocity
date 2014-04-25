var fs = require('fs')
var util = require('util')

var velocity = require('../')
var lexicalParser = require('../lib/engine/lex')

var action = 'render'
process.argv.forEach(function(item, idx, list) {
  if (item in {ast: true, tokens: true, dep: true, data: true}) action = item
})

var file = './root1/index.vm'
var content = fs.readFileSync(file, {encoding: 'utf8'})

var cfg = {
  root: ['root1', 'root2', 'root3'],
  template: file,
  macro: './global-macro/macro.vm'
}

if (action === 'dep') {
  velocity.dep(cfg, true)

} else if (action === 'data') {

  var data = new velocity.Data(cfg)
  try {
    var result = data.extract()
    console.log(util.inspect(result, {depth: null}))
  } catch (e) {
    console.log(e.stack)
  }

} else if (action === 'tokens') {
  var tokens = lexicalParser.parse(content)
  console.log(util.inspect(tokens, {depth: null}))

} else if (action === 'ast') {
  var ast = velocity.parser.parse(content)
  console.log(util.inspect(ast, {depth: null}))

} else {
  var engine = new velocity.Engine(cfg)
  try {
    var result = engine.render('./context.js')
    console.log(result)
  } catch (e) {
    console.log(e.stack)
  }
}


