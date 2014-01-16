var logger = require('./logger');
var handleConf = require('./handle-conf');
var scan = require('./scan');
var render = require('./render');


function vmx(conf) {
  handleConf(conf);

  if (conf.to){
    console.log('\nTODO: translate template.\n')

  } else if (conf.variable) {
    console.log('\nTODO: view variable.\n')

  } else {
    var data = scan(conf);
    render(data, conf);
  }
}


vmx.handleConf = handleConf;
vmx.scan = scan;
vmx.render = render;


module.exports = vmx;