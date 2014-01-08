var path = require('path');
var fs = require('fs');

var logger = require('./logger');
var util = require('./util');
var dep = require('./dep');
var depRender = require('./dep-render');

/*
var defConf = {
  directives: ['include', 'parse', 'cmsparse'],
  roots: [
    '/Users/fool2fish/Projects/alipay/cashier/cashier-htdocs/templates',
    '/Users/fool2fish/Projects/alipay/cms'
  ]
};*/

var defConf = {
  directives: ['parse', 'include'],
  roots: [process.cwd()]
};

function vmx(conf) {
  vmx.handleConf(conf);

  if (conf.to){
    logger.debug('Translate template.');

  } else if (conf.variable) {
    logger.debug('View variable.');

  } else if (conf.file) {
    logger.debug('View dependencies.')
    var data = dep(conf);
    depRender(data, conf);

  } else {
    logger.error('Sorry, vmx dose\'t know what to do.');
  }
}

vmx.handleConf = function(conf) {
  util.mix(conf, defConf);

  conf.roots = conf.roots.filter(function(p){
    if (!fs.existsSync(p)) logger.warn('Conf.roots<', p, '>  not exists.');
    return fs.existsSync(p);
  });
  conf.roots = conf.roots.map(function(p) {
    return path.resolve(p);
  });

  if (conf.dir) {
    if (!fs.existsSync(conf.dir)) {
      logger.warn('Conf.dir<', conf.dir, '> not exists.');
    } else {
      conf.dir = path.resolve(conf.dir);
    }
  }

  if (conf.file) {
    if (!fs.existsSync(conf.file)) {
      logger.warn('Conf.file<', conf.file, '> not exists.');
      delete conf.file;
    } else {
      conf.dir = path.resolve(conf.dir);
    }
  }

  if (conf.variable && !/^[a-zA-z][0-9z-zA-Z-_]*$/.test(conf.variable)) {
    logger.warn('Illegal conf.variable<', conf.variable, '>.');
    delete conf.variable;
  }

  logger.debug(conf);
};

vmx.dep = dep;
vmx.depRender = depRender;

module.exports = vmx;