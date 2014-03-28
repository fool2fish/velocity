var path = require('path')
var fs = require('fs')

var logger = require('./logger')
var util = require('./util')

var defCfg = {
  directives: [],
  encoding: 'utf8'
}

module.exports = function(cfg) {
  var globCfg = util.readConfFile(path.join(util.getHome(), '.vmx'))
  cfg = util.mix(cfg, globCfg, defCfg)

  if (!cfg.roots) {
    logger.error('cfg.roots is required.');
  }
  cfg.roots.forEach(function(p, idx){
    if (!util.isExistedDir(p)) {
      logger.error('cfg.roots[%d] <%s> is not directory or not exists.', idx, p)
    }
  })
  cfg.roots = cfg.roots.map(function(p) {
    return path.resolve(p)
  })

  if (cfg.template) {
    if (util.isExistedFile(cfg.template)) {
      var relPath = util.getRelPath(cfg.template, cfg.roots)
      if (relPath) {
        cfg.template = relPath
      } else {
        logger.error('cfg.template must be subpath of any root in conf.roots.')
      }
    } else {
      logger.error('cfg.template <%s> is not file or not exists.', cfg.template)
    }
  }

  if (cfg.macro) {
    if (!util.isExistedFile(cfg.macro)) {
      logger.error('cfg.macro <%s> is not file or not exists.', cfg.macro)
    }
  }

  return cfg
}