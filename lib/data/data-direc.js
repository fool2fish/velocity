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
    var that = this
    var left = node.left
    var leftr
    if (!common.isId(left)) {
      this.throwError('Left operand of #foreach is not an identifier.', left.pos)
    }
    var name = left.object.name

    var right = node.right
    var rightr = this[right.type](right)
    var o

    if (rightr) {
      var stats = rightr.__stats
      if (stats !== STATS.CERTAIN && stats !== STATS.UNCERTAIN) {
        leftr = BREAK

      } else {
        if (stats === STATS.UNCERTAIN) {
          rightr.__stats = STATS.CERTAIN
          rightr.__value = []
        }

        o = rightr.__value
        if (Array.isArray(o)) {
          if (!node.body) return
          if (!o[0]) o[0] = { __stats: STATS.UNCERTAIN }
          leftr = {
            __stats: STATS.LEFT,
            __value: o[0]
          }
        } else {
          leftr = BREAK
        }
      }

    } else {
      leftr = BREAK
    }

    var ctx = {
          foreach: BREAK,
          velocityCount: BREAK
        }
        ctx[name] = leftr
    this.pushContext(ctx)

    if (leftr.__stats === STATS.BREAK) {
      this[node.body.type](node.body)

    } else {
      o.forEach(function(item, idx) {
        leftr.__value = o[idx]
        that[node.body.type](node.body)
      })
    }

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
    if (!relPath)
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
    this.Extract(null, {
      isFile: false,
      raw: arg.value,
      offset: this.template.offset || arg.pos
    })
  },

  // only analyze define
  Define: function(node) {
    if (!common.isId(node.name)) {
      this.throwError('Param of #define is not an identifier.', node.name.pos)
    }
    var name = node.name.object.name

    var cur = this.topContext[name]
    var origin = common.getOrigin(cur)

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
      logger.warn('Call undefined macro <', name, '>')
      return
    }
    if (!definition.body) return

    var definitionTempl = name in this.template.__macro ? this.template : definition.__template

    var ctx = {}
    var args = node.arguments
    var argsLen = args.length
    var keys = definition.__arguments

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]

      if (i < argsLen) {
        var arg = args[i]
        var argr = this[arg.type](arg)
        ctx[key] = {
          __stats: STATS.LEFT,
          __value: argr || BREAK
        }

      } else {
        ctx[key] = {
          __stats: STATS.LEFT,
          __value: BREAK
        }
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
