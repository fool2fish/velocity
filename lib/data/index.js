var fs = require('fs')
var path = require('path')
var utilx = require('utilx')
var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

var logger = require('../logger')
var common = require('../common')
var handleCfg = require('../handle-cfg')

var parser = require('../engine/velocity')
var formatter = require('./data-formatter')
var STATS = require('./data-stats')


function Data(cfg) {
  this.cfg = handleCfg(cfg)

  // global macro
  this.macro = {}
  if (this.cfg.macro) {
    this.GMacro(this.cfg.macro)
  }
}


Data.tostr = formatter.tostr
Data.dump = formatter.dump


inherits(Data, EventEmitter)


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
  context = formatter.expand(context)

  this.Extract(context)

  ;delete this.topContext.__parent

  var raw = formatter.clean(this.topContext)
  var str

  if (this.cfg.dump) {
    str = formatter.dump(raw)
  } else {
    str = formatter.tostr(raw)
  }

  if (this.cfg.output) {
    fs.writeFileSync(
      this.cfg.output,
      'module.exports = ' + str + '\n'
    )
  }

  return {
    raw: raw,
    str: str
  }
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
  var loc = common.getRealLoc([this.template, pos])
  var templ = loc[0]
      pos = loc[1]
  var line = templ.lines[pos.first_line - 1]

  var e = new Error(message)
      e.stack = common.markError(line, pos) +
                'Error: ' + e.message +
                '\n    at ' + common.loc2str(loc)
  throw e
}

utilx.mix(
  Data.prototype,
  require('../engine/engine-stack'),
  require('./data-ref'),
  require('./data-expr'),
  require('./data-direc')
)

module.exports = Data



