var fs = require('fs')
var util = require('util')

var Engine = require('../lib/engine')
var parser = require('../lib/engine/velocity')
var lexicalParser = require('../lib/engine/lex')
var STATS = require('../lib/engine/engine-stats.js')

var action = 'render'
process.argv.forEach(function(item, idx, list) {
  if (item in {ast: true, tokens: true}) action = item
})

var file = './root1/index.vm'
var content = fs.readFileSync(file, {encoding: 'utf8'})

if (action === 'tokens') {
  var tokens = lexicalParser.parse(content)
  console.log(util.inspect(tokens, {depth: null}))

} else if (action === 'ast') {
  var ast = parser.parse(content)
  console.log(util.inspect(ast, {depth: null}))

} else {
  var context = require('./context')
  var cfg = {
    roots: ['root1', 'root2', 'root3'],
    template: file,
    macro: './global-macro/macro.vm'
  }
  var engine = new Engine(cfg)
  var result = engine.render(context)
  if (result.stats === STATS.SUCCESS) {
    console.log(result.value)
  } else {
    Engine.printFailInfo(result)
  }
}


