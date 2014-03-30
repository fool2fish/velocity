var path = require('path')
var fs = require('fs')

var logger = require('./logger')
var util = require('./util')

var defCfg = {
  directives: [],
  encoding: 'utf8'
}

module.exports = function(cfg) {
  // logger.debug('Raw config', cfg)
  var globCfg = util.readConfFile(path.join(util.getHome(), '.vmx'))
  cfg = util.mix(cfg, globCfg, defCfg)

  checkRequired(cfg, ['roots', 'template'])

  cfg.roots.forEach(function(p, idx){
    if (!util.isExistedDir(p)) {
      logger.error('cfg.roots[%d] <%s> is not directory or not exists.', idx, p)
    }
  })
  cfg.roots = cfg.roots.map(function(p) {
    return path.resolve(p)
  })

  str2Obj(cfg, 'template', true)

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
  if (util.isExistedFile(raw)) {
    if (needRelPath) {
      var relPath = util.getRelPath(raw, cfg.roots)
      if (relPath) {
        cfg.template = {
          isFile: true,
          raw: raw,
          relPath: relPath,
          fullPath: path.resolve(raw)
        }
      } else {
        logger.error('cfg.%s <%s> must be subpath of cfg.roots.', key, raw)
      }
    } else {
      cfg[key] = {
        isFile: true,
        raw: raw,
        fullPath: path.resolve(raw)
      }
    }
  } else {
    cfg[key] = {
      isFile: false,
      raw: raw
    }
    logger.info('cfg.%s <%s> is string.', key, raw)
  }
}
