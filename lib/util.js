var fs = require('fs');

var logger = require('./logger');

exports.mix = function(to, src) {
  var i;
  for (i in src) {
    if (!to[i] && src[i]) to[i] = src[i];
  }
}

exports.getHome =  function() {
  return process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME
}

exports.readConfFile = function(p) {
  try {
    return JSON.parse(fs.readFileSync(p));
  } catch(e) {
      logger.debug('Fail to read config file <%s>.', p);
    return {}
  }
}

exports.isExistedFile = function(p){
  return p && fs.existsSync(p) && fs.statSync(p).isFile();
}

exports.isExistedDir = function(p){
  return p && fs.existsSync(p) && fs.statSync(p).isDirectory();
}

