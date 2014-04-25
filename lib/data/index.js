var fs = require('fs')
var path = require('path')
var utilx = require('utilx')

var logger = require('../logger')
var handleCfg = require('../handle-cfg')

var parser = require('../engine/velocity')
var STATS = require('./data-stats')


function Data(cfg) {
  this.cfg = handleCfg(cfg)

  // global macro
  this.macro = {}
  if (this.cfg.macro) {
    this.GMacro(this.cfg.macro)
  }
}

// process global macro
Data.prototype.GMacro = function(macro) {
  var that = this

  macro.forEach(function(m) {
    var content = m.isFile ? utilx.readFile(m.fullPath, that.cfg.encoding) : m.raw
    var ast = parser.parse(content)
    m.lines = content.split(/\r?\n/)
    ast.body.forEach(function(node){
      if (node.type === 'Macro') {
        that.Macro(node, m)
      }
    })
  })

  // logger.debug('Macro', this.macro)
}

////////////////////////////
// the only public method //
////////////////////////////
Data.prototype.extract = function(context) {
  if (utilx.isExistedFile(context)) {
    context = require(path.resolve(context))
  } else {
    context = utilx.isObject(context) ? context : {}
  }

  this.Extract(context)
  ;delete this.topContext.__parent

  return clean(this.topContext)
}

Data.prototype.Extract = function(context, template) {
  var that = this
  var templ = template || this.cfg.template

  if (context) this.pushContext(context)
  this.pushTemplate(templ)

  var content = templ.raw
  if (templ.isFile) {
    content = utilx.readFile(templ.fullPath, this.cfg.encoding)
  }

  templ.lines = content.split(/\r?\n/)

  var node = parser.parse(content)
  this[node.type](node)

  this.popTemplate()
  if (context) this.popContext()
}

Data.prototype.Statements = function(node) {
  for (var i = 0; i < node.body.length; i++) {
    var cn = node.body[i]
    this[cn.type](cn)
  }
}

Data.prototype.throwError = function (message, pos) {
  logger.error(message)
}

utilx.mix(
  Data.prototype,
  require('../engine/engine-stack'),
  require('./data-ref'),
  require('./data-expr'),
  require('./data-direc')
)

module.exports = Data


function clean(data) {
  if (utilx.isObject(data)) {
    var rt = {}
    var k
    for (k in data) {
      var n = data[k]

      if ((n.__stats === STATS.LEFT || n.__stats === STATS.DEFINE) && n.__origin)
        n = n.__origin

      var stats = n.__stats

      if (stats === STATS.CERTAIN) {
        rt[k] = clean(n.__value)
      } else if (stats === STATS.UNCERTAIN) {
        rt[k] = n.__value || ''
      }
    }
    return rt
  }

  if (utilx.isArray(data)) {
    var rt = []
    data.forEach(function(n) {
      // n.__stats === STATS.LEFT is impossible
      var stats = n.__stats
      if (stats === STATS.CERTAIN) {
        rt.push(clean(n.__value))
      } else if (stats === STATS.UNCERTAIN) {
        rt.push(n.__value || '')
      }
    })
    return rt
  }

  return data

}
