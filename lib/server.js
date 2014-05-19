var fs = require('fs')
var path = require('path')
var express = require('express')
var utilx = require('utilx')

var logger = require('./logger')
var common = require('./common')
var Engine = require('./engine')

module.exports = function(cfg) {
  var engine = new Engine(cfg)
  var app = express()

  app.get('/', function(req, res){
    res.setHeader('Cache-Control', ['private', 'max-age=0', 'no-cache'])

    try {
      var ctx = common.perfectContext(cfg.context)
      var result = engine.render(ctx)
      res.send(result)
    } catch (e) {
      res.send('<pre>' + e.stack.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;') + '</pre>')
    }
  })

  app.listen(6789)
  logger.info('Start server, please visit <localhost:6789>')
}


