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

  checkRequired(cfg, ['roots', 'template'])

  cfg.roots.forEach(function(p, idx){
    if (!util.isExistedDir(p)) {
      logger.error('cfg.roots[%d] <%s> is not directory or not exists.', idx, p)
    }
  })
  cfg.roots = cfg.roots.map(function(p) {
    return path.resolve(p)
  })

  str2Obj(cfg, 'template')

  if (cfg.macro) {
    str2Obj(cfg, 'macro')
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

function str2Obj(cfg, key, needRelPath) {
  var raw = cfg[key]
  if (common.isExistedFile(raw)) {
    cfg[key] = {
      isFile: true,
      raw: raw,
      fullPath: path.resolve(raw)
    }
  } else {
    cfg[key] = {
      isFile: false,
      raw: raw
    }
    logger.info('cfg.%s <%s> is string.', key, raw)
  }
}
