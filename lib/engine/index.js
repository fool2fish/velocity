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

  context = common.perfectContext(context)

  var result = this.Render(context)

  return this._precessResult(result)
}

Engine.prototype._precessResult = function(result) {
  if (result.stats === STATS.SUCCESS || result.stats === STATS.STOP) {
    if (this.cfg.output) fs.writeFileSync(this.cfg.output, result.value)
    return result.value
  } else {
    var origin = result.stack[0]
    var originTempl = origin[0]
    var originPos = origin[1]
    var originLine = originTempl.lines[originPos.first_line - 1]
    var stack = result.stack.map(function(item){
      return common.loc2str(item)
    })

    var e = new Error(result.message || 'Illegal #break.')
        e.stack = common.markError(originLine, originPos) +
                  'Error: ' + e.message +
                  '\n    at ' +
                  stack.join('\n    at ')
    throw e
  }
}

Engine.prototype.compile = function(template) {
  var node = this._compileToNode(template)

  return function(context) {
    if (!context) {
      logger.error('context is required.')
    }

    //context = common.perfectContext(context)

    var result = this._Render(node, template, context)
    return this._precessResult(result)
  }.bind(this);
}

Engine.prototype._compileToNode = function(template) {
  var templ = template || this.cfg.template

  var content = templ.raw
  if (templ.isFile) {
    content = utilx.readFile(templ.fullPath, this.cfg.encoding)
  }

  templ.lines = content.split(/\r?\n/)

  var node
  try {
    node = parser.parse(content)
    // rt = this[node.type](node)
  } catch (e) {
    throw new Error(this.initFailInfo(e.message, common.getPosFromParserError(e)));
    // rt = this.initFailInfo(e.message, common.getPosFromParserError(e))
  }
  return node
}

Engine.prototype.Render = function(context, template) {
  var node = this._compileToNode(template)
  return this._Render(node, template, context)
}

Engine.prototype._Render = function(node, template, context) {
  // some time may not pass context in
  // e.g. called by .DString()
  if (context) this.pushContext(context)

  var templ = template || this.cfg.template

  // very time call this method will pass template in
  // except the first time called by .render()
  this.pushTemplate(templ)
  var rt
  try {
    rt = this[node.type](node)
  } catch(e) {
    rt = this.initFailInfo(e.message, common.getPosFromParserError(e))
  }
  this.popTemplate()
  if (context) this.popContext()

  return rt;
}

Engine.prototype.Statements = function(node) {
  var result = this.initSuccessInfo()

  for (var i = 0; i < node.body.length; i++) {
    var cn = node.body[i]
    var cr = this[cn.type](cn)

    if (cr.stats === STATS.SUCCESS) {
      if (cn.type === 'Reference' && (cr.value === undefined || cr.value === null)) {
        if (!cr.silent) {
          result.value += cr.literal
        }

      } else {
        var v = cr.value
        // capture error thrown by toString method
        if (v && utilx.isFunction(v.toString)) {
          try {
            v = v.toString()
          } catch (e) {
            var newCr = this.initFailInfo('An error thrown by toString method\n\n' + e.stack + '\n', cn.pos)
            this.mergeResult(result, newCr)
            break
          }
        }
        result.value += v
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
    stack: [common.getRealLoc([this.template, pos])]
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
