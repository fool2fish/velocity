#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var commander = require('commander')
var colorful = require('colorful')
var utilx = require('utilx')

var pkg = require('../package')
var velocity = require('..')
var logger = require('../lib/logger')

var cwd = process.cwd()


commander
  .description(pkg.description)
  .option('-v, --version',      'output version number')
  .option('-d, --debug',        'show debug message')
  .option('-O, --root <s>',     'template root path', utilx.split)
  .option('-M, --macro <s>',    'global macro file/input', utilx.split)
  .option('-t, --template <s>', 'template file/input')
  .option('-c, --context <s>',  'context file/input')
  .option('-e, --encoding <s>', 'encoding')
  .option('-o, --output <s>',   'output file path')
  .option('-R, --reverse',      'view reversed dependencies')
  .option('--data',             'extract data structure from template')
  .option('--dump',             'generate intermediate template to dump the context')
  .on('version', function() {
    console.log('\n  ' + colorful.cyan(pkg.version) + '\n')
    process.exit(0)
  })
  .helpInformation = utilx.cGetHelp(pkg)

  
commander.parse(process.argv)


var cfg = utilx.cGetCfg(commander)

// Merge config file
var cfgFile = './velocity-config.js'
if (utilx.isExistedFile(cfgFile)) {
  var projCfg = require(path.resolve(cfgFile))
  cfg = utilx.mix(cfg, projCfg)
}


// Extract data structure
if (cfg.data || cfg.dump) {
  var data = new velocity.Data(cfg)
  var result = data.extract(cfg.context)
  
  if (cfg.output) {
    console.log('\nOutput is saved to ' + cfg.output + '\n')
  } else {
    console.log(result.str)
  }

// Render Content
} else if (cfg.context){
  var engine = new velocity.Engine(cfg)
  var result = engine.render(cfg.context)
  
  if (cfg.output) {
    console.log('\nOutput is saved to ' + cfg.output + '\n')
  } else {
    console.log(result)
  }
  
// View dependencies
} else {
  velocity.dep(cfg)
}


