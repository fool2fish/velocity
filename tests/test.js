var fs = require('fs')
var util = require('util')

var parser = require('../lib/engine/velocity')
var lexicalParser = require('./lex')
var Engine = require('../lib/engine')
var file = '../examples/templates/index.vm'


var content = fs.readFileSync(file).toString()

var lexicalList = lexicalParser.parse(content)
//console.log(util.inspect(lexicalList, {depth: null}))

console.log('\n------------------\n')

var ast = parser.parse(content)
console.log(util.inspect(ast, {depth: null}))

console.log('\n------------------\n')

var engine = new Engine({
  roots: ['../examples/templates'],
  macro: '../examples/macro.vm',
  template: file
})
var output = engine.render({
  name: 'fool2fish',
  info: {
    job: 'developer',
    lang: 'node'
  },
  list: ['first', 'second', 'third'],
  method: {
    foo: function(){return 'method return'},
    date: function(y, m, d) {
      return y + ' - ' + m + ' - ' + d
    }
  },
  eval: '$name'
})
console.log(output)
