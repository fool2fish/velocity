var logger = require('./logger');
var handleConf = require('./handle-conf');
var scan = require('./scan');
var render = require('./render');


function vmx(conf) {
  handleConf(conf);

  if (conf.to){

  } else if (conf.variable || conf.file) {
    var data = scan(conf);
    render(data, conf);
  } else {
    logger.error('Sorry, vmx dose\'t know what to do.');
  }
}


vmx.scan = scan;
vmx.render = render;


module.exports = vmx;