var path = require('path')
var fs = require('fs')
var utilx = require('utilx')
var _ = require('lodash')

var logger = require('./logger')

var defCfg = {
  encoding: 'utf8'
}

module.exports = function(cfg) {
  // logger.debug('Raw config', cfg)

  var cfgFile = './velocity-config.js'
  if (utilx.isExistedFile(cfgFile)) {
    var projCfg = require(path.resolve(cfgFile))
    cfg = utilx.mix(cfg, projCfg)
    // logger.debug('Mix project config', cfg)
  }

  cfg = utilx.mix(cfg, defCfg)

  // Template
  if (!cfg.template) logger.error('Option template is required.')
  cfg.template = str2Obj(cfg.template)

  // Root
  if (cfg.root) {
    if (_.isString(cfg.root)) cfg.root = [cfg.root]
    cfg.root.forEach(function(p, idx){
      if (!utilx.isExistedDir(p)) {
        logger.error('Option root <%s> is not directory or not exists.', p)
      }
    })
    cfg.root = cfg.root.map(function(p) {
      return path.resolve(p)
    })
  }

  // Macro
  if (cfg.macro) {
    if (_.isString(cfg.macro)) cfg.macro = [cfg.macro]
    cfg.macro = cfg.macro.map(function(raw) {
      return str2Obj(raw)
    })
  }

  logger.debug('Processed config', cfg)
  return cfg
}


function str2Obj(raw) {
  if (utilx.isExistedFile(raw)) {
    return {
      isFile: true,
      raw: raw,
      fullPath: path.resolve(raw)
    }
  } else if (_.isString(raw)){
    return {
      isFile: false,
      raw: raw
    }
  } else {
    logger.error('Value of config.value or config.template must be a file path or a velocity string.')
  }
}
