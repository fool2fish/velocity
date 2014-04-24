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
      return this.throwError('Left operand of #foreach is not an identifier.', left.pos)
    }
    var name = left.object.name

    var right = node.right
    var rightr = this[right.type](right)

    if (!rightr) return

    var stats = rightr.__stats
    if (stats === STATS.BREAK) return objr

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
    var argr = this[arg.type](arg)

    if (argr.stats === STATS.FAIL) return argr

    // argr.stats === STATS.SUCCESS
    var relPath = argr.value
    if (!utilx.isNonEmptyString(relPath))
      return this.initFailInfo('Param of #parse is not a non-empty string.', arg.pos)

    var fullPath = common.getFullPath(relPath, this.cfg.root)
    if (fullPath) {
      var result = this.Render(null, {
        isFile: true,
        raw: relPath,
        relPath: relPath,
        fullPath: fullPath
      })
      if (result.stats !== STATS.SUCCESS) {
        result.stack.push([this.template, node.pos])
      }
      return result
    } else {
      return this.initFailInfo('Param of #parse not exists or is not subpath of root.', arg.pos)
    }
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
        return this.initFailInfo('Param of #macro is not an identifier.', arg.pos)
      }
      node.__arguments.push(arg.object.name)
    }

    if (templ) {
      node.__template = templ
      this.macro[node.name] = node
    } else {
      this.template.__macro[node.name] = node
    }

    return this.initSuccessInfo()
  },

  MacroCall: function(node) {
    var name = node.name

    if (name === 'cmsparse') return

    var definition = this.template.__macro[name] || this.macro[name]
    if (!definition) {
      return this.initFailInfo('Call undefined macro.', node.pos)
    }
    var definitionTempl = name in this.template.__macro ? this.template : definition.__template

    if (definition.arguments.length !== node.arguments.length) {
      return this.initFailInfo('Mismatch length of macro parameters.', node.pos)
    }

    if (!definition.body) return this.initSuccessInfo()

    var ctx = {}
    var args = node.arguments
    var keys = definition.__arguments

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      var argr = this[arg.type](arg)

      if (argr.stats === STATS.FAIL) return argr

      // argr.stats === STATS.SUCCESS
      ctx[keys[i]] = argr.value
    }

    if (node.isBlock && node.body) {
      var body = node.body
      var bodyr = this[body.type](body)
      if (bodyr.stats === STATS.FAIL) return bodyr
      if (bodyr.stats === STATS.BREAK || bodyr.stats === STATS.STOP)
        return this.initFailInfo('Illegal #break or #stop.', bodyr.pos)
      ctx.bodyContent = bodyr.value
    }

    this.pushContext(ctx)
    this.pushTemplate(definitionTempl)
    var result = this[definition.body.type](definition.body)
    this.popTemplate()
    this.popContext()

    if (result.stats !== STATS.SUCCESS) {
      // at where the macro is called
      result.stack.push([this.template, node.pos])
    }

    return result
  },


  Stop: function(node) {},
  Break: function(node) {}
}



