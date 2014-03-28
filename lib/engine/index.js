var fs = require('fs')
var path = require('path')
var parser = require('./velocity')
var util = require('../util')
var logger = require('../logger')
var handleCfg = require('../handle-cfg')

function Engine(cfg) {
  this.cfg = handleCfg(cfg)
  logger.debug('Config', this.cfg)

  // ast cache
  this.ast = {}
  // ast of global macro
  this.macro = {}
  if (this.cfg.macro) {
    this.parseMacro(this.cfg.macro)
  }
}

Engine.prototype.parseMacro = function(file) {
  var that = this
  var macro = {}
  var ast = parser.parse(fs.readFileSync(file, {encoding: this.cfg.encoding}))
  ast.body.forEach(function(node){
    if (node.type === 'Macro') {
      that.Macro(node, true)
    }
  })
  // logger.debug('Macro', this.macro)
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

Engine.prototype.get = function(key) {
  var ctx = this.context
  for (ctx; ctx; ctx = ctx.__parent) {
    if (ctx[key]) return ctx[key]
  }
  return undefined
}

/**
 * @param {Object} context
 * @param {String} template could be file path or content
 */
Engine.prototype.render = function(context, template) {
  if (!arguments.length) {
    logger.error('Context is required.')
  }

  if (context) this.pushContext(context)

  var templ = template || this.cfg.template
  var fullPath = util.getFullPath(templ, this.cfg.roots)
  var node

  // file path
  if (fullPath) {
    if (!(fullPath in this.ast)) {
      var content = fs.readFileSync(fullPath, {encoding: this.cfg.encoding})
      this.ast[fullPath] = parser.parse(content)
    }
    node = this.ast[fullPath]
  // content
  } else {
    node = parser.parse(templ)
  }

  // logger.debug('Ast', node)
  var rt = this[node.type](node, context && !template)
  if (context) this.popContext(context)
  return rt
}

Engine.prototype.Statements = function(node, isRoot) {
  var that = this
  var content = ''
  var body = node.body
  try {
    body.forEach(function(cnode) {
      content += that[cnode.type](cnode)
    })
  } catch (e) {
    if (isRoot) {
      switch (e.message) {
        case '__VELOCITY_STOP':
          return content
        case '__VELOCITY_BREAK':
          logger.error('#break only can be used in #foreach.')
        default:
          throw e
          break
      }
    } else {
      throw e
    }
  }
  return content
}

util.mix(
  Engine.prototype,
  require('./engine-ref'),
  require('./engine-expr'),
  require('./engine-direc')
)

module.exports = Engine






