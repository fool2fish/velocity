'use strict'

var fs = require('fs')
var Benchmark = require('benchmark')
var suite = new Benchmark.Suite()
var VelocityEngine = require('../index').Engine
var nunjucks = require('nunjucks')
var context = require('./context')
var velocityTemplStr = fs.readFileSync(__dirname + '/template-velocity.vm', {encoding: 'utf-8'})
var nunjucksTemplStr = fs.readFileSync(__dirname + '/template-nunjucks.html', {encoding: 'utf-8'})

var velocityEngine = new VelocityEngine({
  template: velocityTemplStr
})

var velocityTempl = velocityEngine.compile()

var nunjucksTempl = nunjucks.compile(nunjucksTemplStr)

//var r = velocityEngine.render(context)
//var r = velocityTempl(context);

//console.log(r)
suite.add('velocity without precompiling', function() {
  velocityEngine.render(context)
})

.add('nunjucks without precompiling', function(defer) {
  nunjucks.renderString(nunjucksTemplStr, context)
})

.add('velocity with precompiling', function() {
  velocityTempl(context)
})

.add('nunjucks with precompiling', function() {
  nunjucksTempl.render(context)
})

// add listeners
.on('cycle', function(event) {
  console.log(String(event.target))
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'))
  process.exit(0)
})
// run async
.run({ 'async': true })
