var logger = require('./logger');
var util = require('./util');
var path = require('path');

var dep = require('./dep');
var depRender = require('./dep-render');

/*
var defConf = {
  directives: {
    include: '/Users/fool2fish/Projects/alipay/cashier/cashier-htdocs/templates',
    parse: function(path) {
      if (path.indexOf('/public') > -1) {
        return '/Users/fool2fish/Projects/alipay/uisvr';
      } else {
        return '/Users/fool2fish/Projects/alipay/cashier/cashier-htdocs/templates';
      }
    },
    cmsparse: '/Users/fool2fish/Projects/alipay/cms'
  }
}*/

var defConf = {
  directives: {
    include: process.cwd(),
    parse: process.cwd(),
    cmsparse: '/Users/fool2fish/Projects/alipay/cms'
  }
}

function vmx(conf) {
  vmx.handleConf(conf);

  // translate template
  if (conf.to) {

  // view variable
  } else if (conf.variable) {

  // view dependencies
  } else {
    if (conf.reverse) {

    } else {
      var data = dep(conf);
      depRender(data, conf);
    }
  }
};

vmx.handleConf = function(conf) {
  util.mix(conf, defConf);
  conf.dir = conf.dir ? path.resolve(conf.dir) : conf.dir;
  conf.file = conf.file ? path.resolve(conf.file) : conf.file;
  logger.debug(conf);
}

vmx.dep = dep;
vmx.depRender = depRender;

module.exports = vmx;