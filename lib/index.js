var logger = require('./logger');
var util = require('./util');
var path = require('path');

var dep = require('./dep');
var depRener = require('./dep-render');

/*
var defConf = {
  directives: {
    include: '/Users/fool2fish/Projects/alipay/cashier/cashier-htdocs/templates',
    parse: function(path) {
      if (path.indexOf('/public') === 0) {
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
  util.mix(conf, defConf);
  // logger.debug(conf);

  // translate template
  if (conf.to) {

  // view variable
  } else if (conf.variable) {

  // view forth or back including tree
  } else {
    if (conf.reverse) {

    } else {
      var data = dep(conf);
      depRener(path.resolve(conf.file), data);
      //console.log(dep(conf));
    }
  }
};

module.exports = vmx;