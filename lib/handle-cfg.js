var path = require('path')
var fs = require('fs')
var common = require('totoro-common')

var logger = require('./logger')
var util = require('./util')

var defCfg = {
  encoding: 'utf8'
}

module.exports = function(cfg) {
  // logger.debug('Raw config', cfg)
  var globCfg = common.readCfgFile(path.join(common.home, '.vmx'))
  cfg = common.mix(cfg, globCfg, defCfg)
  // logger.debug('Merged config', cfg)

  checkRequired(cfg, ['roots', 'template'])

  if (util.isString(cfg.roots)) cfg.roots = [cfg.roots]
  cfg.roots.forEach(function(p, idx){
    if (!util.isExistedDir(p)) {
      logger.error('cfg.roots[%d] <%s> is not directory or not exists.', idx, p)
    }
  })
  cfg.roots = cfg.roots.map(function(p) {
    return path.resolve(p)
  })

  cfg.template = str2Obj(cfg.template)

  if (cfg.macro) {
    if (util.isString(cfg.macro)) cfg.macro = [cfg.macro]
    cfg.macro = cfg.macro.map(function(raw) {
      return str2Obj(raw)
    })
  }

  if (cfg.context && common.isExistedFile(cfg.context)) {
    cfg.context = require(path.resolve(cfg.context))
  }

  // logger.debug('Processed config', cfg)
  return cfg
}

function checkRequired(cfg, requiredList) {
  requiredList.forEach(function(key) {
    if (!(key in cfg)) {
      logger.error('cfg.%s is required.', key)
    }
  })
}

function str2Obj(raw) {
  if (common.isExistedFile(raw)) {
    return {
      isFile: true,
      raw: raw,
      fullPath: path.resolve(raw)
    }
  } else {
    return {
      isFile: false,
      raw: raw
    }
  }
}
