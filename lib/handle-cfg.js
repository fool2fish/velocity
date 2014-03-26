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
    if (!fs.existsSync(p)) {
      logger.error('cfg.roots[%d] <%s>  not exists.', idx, p)
    }
  })
  cfg.roots = cfg.roots.map(function(p) {
    return path.resolve(p)
  })

  if (cfg.template) {
    if (fs.existsSync(cfg.template)) {
      var relPath = util.getRelPath(cfg.template, cfg.roots)
      if (relPath) {
        cfg.template = relPath
      } else {
        logger.error('cfg.template must be subpath of any root in conf.roots.')
      }
    } else {
      logger.error('cfg.template <%s> not exists.', cfg.template)
    }
  }

  if (cfg.macro) {
    if (!fs.existsSync(cfg.macro)) {
      logger.error('cfg.macro <%s> not exists.', cfg.macro)
    }
  }

  return cfg
}