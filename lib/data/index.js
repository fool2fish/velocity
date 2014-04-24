var fs = require('fs')
var path = require('path')
var utilx = require('utilx')

var logger = require('../logger')
var handleCfg = require('../handle-cfg')

var parser = require('../engine/velocity')


function Data(cfg) {
  this.cfg = handleCfg(cfg)

  // context created by user
  // includes #set and #define
  this.userContext = {}

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
    context = context || {}
  }

  this.Extract(context)
  ;delete this.topContext.__parent
  return this.topContext
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


