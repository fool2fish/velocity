var fs = require('fs')
var path = require('path')
var express = require('express')
var common = require('totoro-common')

var logger = require('./logger')
var Engine = require('./engine')

module.exports = function(cfg) {
  var engine = new Engine(cfg)
  var app = express()

  app.get('/', function(req, res){
    res.setHeader('Cache-Control', ['private', 'max-age=0', 'no-cache'])

    var ctx = cfg.context
    if (common.isExistedFile(cfg.context)) {
      var fullPath = path.resolve(cfg.context)
      ; delete require.cache[fullPath]
      var ctx = require(fullPath)
    }

    try {
      var result = engine.render(ctx)
      if (result.success) {
        res.send(result.value)
      } else {
        result.stack = result.stack.map(function(item) {
          return item[0] + ' (' + item[1].first_line + ':' + item[1].first_column + ')'
        })
        res.send(result)
      }
    } catch (e) {
      res.send(e)
    }
  })

  app.listen(6789)
  logger.info('Start server', '<localhost:6789>')
}


