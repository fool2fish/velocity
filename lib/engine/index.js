var fs = require('fs')
var path = require('path')
var utilx = require('utilx')

var logger = require('../logger')
var common = require('../common')
var handleCfg = require('../handle-cfg')

var parser = require('./velocity')
var STATS = require('./engine-stats')

function Engine(cfg) {
  this.cfg = handleCfg(cfg)

  // global macro
  this.macro = {}
  if (this.cfg.macro) {
    this.GMacro(this.cfg.macro)
  }
}

// process global macro
Engine.prototype.GMacro = function(macro) {
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
Engine.prototype.render = function(context) {
  if (!context) {
    logger.error('context is required.')
  }

  if (utilx.isExistedFile(context)) {
    context = require(path.resolve(context))
  } else {
    context = utilx.isObject(context) ? context : {}
  }

  var result = this.Render(context)

  if (result.stats === STATS.SUCCESS || result.stats === STATS.STOP) {
    return result.value

  } else {
    var origin = result.stack[0]
    var originTempl = origin[0]
    var originPos = origin[1]
    var originLine = originTempl.lines[originPos.first_line - 1]
    var stack = result.stack.map(function(item){
          var template = item[0]
          var file = template.fullPath || common.trim(template.raw)
          var pos = item[1]
          return file + ' (' + pos.first_line + ':' + pos.first_column + ')'
        })

    var e = new Error(result.message || 'Illegal #break.')
        e.stack = common.markError(originLine, originPos) +
                  'Error: ' + e.message +
                  '\n    at ' +
                  stack.join('\n    at ')
    throw e
  }
}

Engine.prototype.Render = function(context, template) {
  var that = this
  var templ = template || this.cfg.template

  // some time may not pass context in
  // e.g. called by .DString()
  if (context) this.pushContext(context)
  // very time call this method will pass template in
  // except the first time called by .render()
  this.pushTemplate(templ)

  var content = templ.raw
  if (templ.isFile) {
    content = utilx.readFile(templ.fullPath, this.cfg.encoding)
  }

  templ.lines = content.split(/\r?\n/)

  var node = parser.parse(content)
  var rt = this[node.type](node)

  this.popTemplate()
  if (context) this.popContext()

  return rt
}

Engine.prototype.Statements = function(node) {
  var result = this.initSuccessInfo()

  for (var i = 0; i < node.body.length; i++) {
    var cn = node.body[i]
    var cr = this[cn.type](cn)

    if (cr.stats === STATS.SUCCESS) {
      if (cn.type === 'Reference' && cr.value === undefined) {
        if (!cr.silent) {
          result.value += cr.literal
        }
      } else {
        result.value += cr.value
      }

    } else {
      this.mergeResult(result, cr)
      break
    }
  }
  return result
}


utilx.mix(
  Engine.prototype,
  require('./engine-stack'),
  require('./engine-ref'),
  require('./engine-expr'),
  require('./engine-direc')
)


// below are some assistant methods
Engine.prototype.initSuccessInfo = function() {
  return {
    stats: STATS.SUCCESS,
    value: ''
  }
}

Engine.prototype.initFailInfo = function(msg, pos) {
  return {
    stats: STATS.FAIL,
    value: '',
    message: msg,
    stack: [[this.template, pos]]
  }
}

// merge not successful result
Engine.prototype.mergeResult = function(target, src) {
  target.stats = src.stats
  target.value += src.value
  target.stack = src.stack
  if (src.stats === STATS.FAIL)
    target.message = src.message
}

module.exports = Engine






