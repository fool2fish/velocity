var fs = require('fs')
var util = require('util')

var parser = require('../lib/parser/velocity')
var lexicalParser = require('./lex')
var file = './test.vm'

var content = fs.readFileSync(file).toString()

var lexicalList = lexicalParser.parse(content)
console.log(util.inspect(lexicalList, {depth: null}))

var ast = parser.parse(content)
//console.log(util.inspect(ast, {depth: null}))

