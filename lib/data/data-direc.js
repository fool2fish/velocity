var fs = require('fs')
var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')

var STATS = require('./data-stats')
var BREAK = { __stats: STATS.BREAK }


module.exports = {
  If: function(node) {
    var test = node.test
    this[test.type](test)

    var cons = node.consequent
    cons && this[cons.type](cons)

    var alter = node.alternate
    alter && this[alter.type](alter)
  },

  Foreach: function(node) {
    var left = node.left
    if (!common.isId(left)) {
      this.throwError('Left operand of #foreach is not an identifier.', left.pos)
    }
    var name = left.object.name

    var right = node.right
    var rightr = this[right.type](right)

    if (!rightr) return

    var stats = rightr.__stats
    if (stats === STATS.BREAK) return rightr

    if (stats === STATS.UNCERTAIN) {
      rightr.__stats = STATS.CERTAIN
      rightr.__value = []
    }

    var o = rightr.__value
    if (!utilx.isArray(o)) return
    if (!node.body) return

    if (!o[0]) o[0] = { __stats: STATS.UNCERTAIN }

    var ctx = {
          foreach: BREAK,
          velocityCount: BREAK
        }
        ctx[name] = {
          __stats: STATS.LEFT,
          __value: o[0]
        }
    this.pushContext(ctx)
    this[node.body.type](node.body)
    this.popContext()
  },

  Include: function(node) {
    var args = node.arguments

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      this[arg.type](arg)
    }
  },

  Parse: function(node) {
    var arg = node.argument
    this[arg.type](arg)

    if (!common.isLiteralString(arg)) return

    var relPath = arg.value
    if (!utilx.isNonEmptyString(relPath))
      this.throwError('Param of #parse is not a non-empty string.', arg.pos)

    var fullPath = common.getFullPath(relPath, this.cfg.root)
    if (!fullPath)
      this.throwError ('Param of #parse not exists or is not subpath of root.', arg.pos)

    this.Extract(null, {
      isFile: true,
      raw: relPath,
      relPath: relPath,
      fullPath: fullPath
    })
  },

  Evaluate: function(node) {
    var arg = node.argument
    this[arg.type](arg)

    if (!arg.type === 'String') return
    this.Extract(null, {isFile: false, raw: arg.value})
  },

  // only analyze define
  Define: function(node) {
    if (!common.isId(node.name)) {
      this.throwError('Param of #define is not an identifier.', name.pos)
    }
    var name = node.name.object.name

    var cur = this.topContext[name]
    var origin = cur && cur.__origin ? cur.__origin : cur

    this.topContext[name] = {
      __stats: STATS.DEFINE,
      __origin: origin
    }

    if (!node.body) return
    var body = node.body
    this[body.type](body)
  },

  Macro: function(node, templ) {
    node.__arguments = []
    var args = node.arguments
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      if (!common.isId(arg)) {
        this.throwError('Param of #macro is not an identifier.', arg.pos)
      }
      node.__arguments.push(arg.object.name)
    }

    if (templ) {
      node.__template = templ
      this.macro[node.name] = node
    } else {
      this.template.__macro[node.name] = node
    }
  },

  MacroCall: function(node) {
    var name = node.name

    if (name === 'cmsparse') return

    var definition = this.template.__macro[name] || this.macro[name]
    if (!definition) {
      this.throwError('Call undefined macro.', node.pos)
    }
    var definitionTempl = name in this.template.__macro ? this.template : definition.__template

    if (definition.arguments.length !== node.arguments.length) {
      this.throwError('Mismatch length of macro parameters.', node.pos)
    }

    if (!definition.body) return

    var ctx = {}
    var args = node.arguments
    var keys = definition.__arguments

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      var argr = this[arg.type](arg)

      ctx[keys[i]] = {
        __stats: STATS.LEFT,
        __value: argr || BREAK
      }
    }

    if (node.isBlock && node.body) {
      var body = node.body
      var bodyr = this[body.type](body)
      ctx.bodyContent = bodyr || BREAK
    }

    this.pushContext(ctx)
    this.pushTemplate(definitionTempl)
    this[definition.body.type](definition.body)
    this.popTemplate()
    this.popContext()

  },


  Stop: function(node) {},
  Break: function(node) {}
}



