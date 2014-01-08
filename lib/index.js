var logger = require('./logger');
var util = require('./util');
var path = require('path');

var dep = require('./dep');
var depRender = require('./dep-render');

/*
var defConf = {
  directives: ['include', 'parse', 'cmsparse'],
  roots: [
    '/Users/fool2fish/Projects/alipay/cashier/cashier-htdocs/templates',
    '/Users/fool2fish/Projects/alipay/cms'
  ]
}*/

var defConf = {
  directives: ['parse', 'include'],
  roots: [process.cwd()]
}

function vmx(conf) {
  vmx.handleConf(conf);

  // translate template
  if (conf.to) {

  // view variable
  } else if (conf.variable) {

  // view dependencies
  } else {
    var data = dep(conf);
    depRender(data, conf);
  }
};

vmx.handleConf = function(conf) {
  util.mix(conf, defConf);
  conf.roots.map(function(p) {
    return path.resolve(p);
  })
  if (conf.dir) conf.dir = path.resolve(conf.dir);
  if (conf.file) conf.file = path.resolve(conf.file);

  logger.debug(conf);
}

vmx.dep = dep;
vmx.depRender = depRender;

module.exports = vmx;