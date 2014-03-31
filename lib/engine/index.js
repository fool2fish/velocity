var fs = require('fs')
var path = require('path')
var iconv = require('iconv-lite')

var util = require('../util')
var logger = require('../logger')
var handleCfg = require('../handle-cfg')

var parser = require('./velocity')
var STATS = require('./engine-stats')

function Engine(cfg) {
  this.cfg = handleCfg(cfg)

  // help to position semantic error
  this.template = this.cfg.template

  // template file cache
  this.cache = {/* fullPath: {ast: x, lines: x} */}
  this.watcher = {/* fullPath: true */}

  // global macro ast
  this.macro = {}
  if (this.cfg.macro) {
    this.getMacro(this.cfg.macro)
  }
}

// process global macro
Engine.prototype.getMacro = function(obj) {
  var that = this
  var content = obj.isFile ? fs.readFileSync(obj.fullPath, {encoding: this.cfg.encoding}) : obj.raw
  var ast = parser.parse(content)
  ast.body.forEach(function(node){
    if (node.type === 'Macro') {
      that.Macro(node, true)
    }
  })
  // logger.debug('Macro', this.macro)
}

Engine.prototype.render = function(context) {
  if (!context) {
    logger.error('context is required.')
  }

  var result = this.Render(context)

  if (result.stats === STATS.SUCCESS) return result
  if (result.stats === STATS.STOP) {
    result.stats = STATS.SUCCESS
    return result
  }

  return {
    stats: STATS.FAIL,
    message: result.message || 'Illegal #break.',
    file: result.template.relPath || trim(result.template.raw),
    line: result.template.lines[result.pos.first_line - 1],
    pos: [result.pos.first_line, result.pos.first_column]
  }
}

Engine.prototype.pushContext = function(context) {
  if (!this.context) {
    context.__macro = util.mix(null, this.macro)
    this.topContext = context
  }
  context.__parent = this.context
  this.context = context
  // logger.debug('Push context.', this.context)
}

Engine.prototype.popContext = function() {
  this.context = this.context.__parent
  // logger.debug('Pop context.', this.context)
}

Engine.prototype.pushTemplate = function(template) {
  template.__parent = this.template
  this.template = template
}

Engine.prototype.popTemplate = function() {
  this.template = this.template.__parent
}

Engine.prototype.get = function(key) {
  var ctx = this.context
  for (ctx; ctx; ctx = ctx.__parent) {
    if (ctx[key] !== undefined) return ctx[key]
  }
  return undefined
}

Engine.prototype.Render = function(context, template) {
  var that = this
  if (context) this.pushContext(context)
  if (template && template.isFile) this.pushTemplate(template)

  var templ = template || this.template
  var node
  if (templ.isFile) {
    var fullPath = templ.fullPath

    if (!(fullPath in this.watcher)) {
      this.watcher[fullPath] = true
      fs.watchFile(fullPath, function (curr, prev) {
        ;delete that.cache[fullPath]
        logger.debug('File <%s> changed.', fullPath)
      })
    }

    if (!(fullPath in this.cache)) {
      var buf = fs.readFileSync(fullPath)
      var content = iconv.decode(buf, this.cfg.encoding)
      this.cache[fullPath] = {
        ast: parser.parse(content),
        lines: content.split(require('os').EOL)
      }
    }
    node = this.cache[fullPath].ast
    templ.lines = this.cache[fullPath].lines

  } else {
    node = parser.parse(templ.raw)
    templ.lines = templ.raw.split(require('os').EOL)
  }

  // logger.debug('Ast', node)
  var rt = this[node.type](node)

  if (template && template.isFile) this.popTemplate(template)
  if (context) this.popContext(context)

  return rt
}

// bellow are ast processors
Engine.prototype.Statements = function(node) {
  var result = this.initSuccessInfo()

  for (var i = 0; i < node.body.length; i++) {
    var cn = node.body[i]
    var cr = this[cn.type](cn)
    if (cr.stats === STATS.SUCCESS) {
      result.value += cr.value
    } else {
      this.mergeResult(result, cr)
      break
    }
  }
  return result
}

util.mix(
  Engine.prototype,
  require('./engine-ref'),
  require('./engine-expr'),
  require('./engine-direc')
)


// bellow are some assistant methods
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
    template: this.template,
    pos: pos
  }
}

// merge not successful result
Engine.prototype.mergeResult = function(target, src) {
  target.stats = src.stats
  target.value += src.value
  target.template = src.template
  target.pos = src.pos
  if (src.stats === STATS.FAIL)
    target.message = src.message
}

function trim (str) {
  var len = str.length
  var str = str.substr(0, 40).replace(/\n/g, '\\n')
  if (len > 40) str += '...'
  return str
}

module.exports = Engine






