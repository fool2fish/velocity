var path = require('path');
var fs = require('fs');

var logger = require('./logger');
var util = require('./util');


module.exports = function(conf) {
  var globalConf = util.readConfFile(path.join(util.getHome(), '.vmx'));

  if (globalConf.roots && globalConf.roots.toString() === '[object Object]') {
    if (!conf.roots) {
      if (globalConf.roots.default) {
        conf.roots = globalConf.roots.default;
      } else {
        logger.error('GlobalConf.roots.default is required when lack of conf.roots.');
        delete globalConf.roots;
      }
    } else if (conf.roots.length === 1 && (conf.roots[0] in globalConf.roots)) {
      conf.roots = globalConf.roots[conf.roots[0]];
    }
  }

  util.mix(conf, globalConf);

  conf.directives = conf.directives || ['include', 'parse']

  if (!conf.roots) {
    logger.error('Conf.roots is required.');
    conf.roots = [];
  }
  conf.roots = conf.roots.filter(function(p){
    if (!fs.existsSync(p)) logger.error('Conf.roots <%s>  not exists.', p);
    return fs.existsSync(p);
  });
  conf.roots = conf.roots.map(function(p) {
    return path.resolve(p);
  });

  if (conf.file) {
    if (util.isExistedFile(conf.file)) {
      if (path.extname(conf.file) === '.vm') {
        conf.file = path.resolve(conf.file);
        if (!conf.roots.some(function(root) {
            return conf.file.indexOf(root) === 0;
          })) {
          logger.error('Conf.file must be subpath of any root in conf.roots.')
        };
      } else {
        logger.error('Conf.file is not a velocity template file.');
      }
    } else {
      logger.error('Conf.file <%s> not exists.', conf.file);
      delete conf.file;
    }
  }

  if (conf.variable && !(conf.variable === '_' || /^[a-zA-Z][0-9a-zA-Z-_]*$/.test(conf.variable))) {
    logger.error('Illegal conf.variable <%s>.', conf.variable);
    delete conf.variable;
  }

  logger.debug(conf);
}