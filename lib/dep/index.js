var scan = require('./scan')
var render = require('./render')
var handleCfg = require('../handle-cfg')

module.exports = function(cfg) {
  cfg = handleCfg(cfg)
  var data = scan(cfg)
  render(data, cfg.template.fullPath, cfg.reverse)
  return data
}
