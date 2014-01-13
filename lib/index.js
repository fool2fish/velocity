var path = require('path');
var fs = require('fs');

var logger = require('./logger');
var util = require('./util');
var scan = require('./scan');
var render = require('./render');

/*
var defConf = {
  directives: ['include', 'parse', 'cmsparse'],
  roots: [
    '/Users/fool2fish/Projects/alipay/cashier/cashier-htdocs/templates',
    '/Users/fool2fish/Projects/alipay/uisvr',
    '/Users/fool2fish/Projects/alipay/cms'
  ]
};*/

var defConf = {
  directives: ['include', 'parse', 'cmsparse'],
  roots: [process.cwd(), path.join(process.cwd(), '../cms')]
};

function vmx(conf) {
  vmx.handleConf(conf);

  if (conf.to){

  } else if (conf.variable || conf.file) {
    var data = scan(conf);
    render(data, conf);
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

  if (conf.file) {
    if (!fs.existsSync(conf.file)) {
      logger.warn('Conf.file<', conf.file, '> not exists.');
      delete conf.file;
    } else {
      conf.file = path.resolve(conf.file);
    }
  }

  if (conf.variable && !(conf.variable === '_' || /^[a-zA-Z][0-9a-zA-Z-_]*$/.test(conf.variable))) {
    logger.warn('Illegal conf.variable<', conf.variable, '>.');
    delete conf.variable;
  }

  logger.debug(conf);
};

vmx.scan = scan;
vmx.render = render;

module.exports = vmx;