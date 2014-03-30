var util = require('../util')
var logger = require('../logger')

var STATS = require('./engine-stats')


module.exports = {
  If: function(node) {
    var test = node.test
    var testr = this[test.type](test)

    if (testr.stats === STATS.FAIL) return testr

    // testr.stats === STATS.SUCCESS
    if (testr.value && node.consequent) {
      return this[node.consequent.type](node.consequent)
    } else if (!testr.value && node.alternate) {
      return this[node.alternate.type](node.alternate)
    } else {
      return this.initSuccessInfo()
    }
  },

  Foreach: function(node) {
    var left = node.left
    if (!isId(left)) {
      return this.initFailInfo('Left operand of #foreach must be an identifier.', left.pos)
    }

    var right = node.right
    var rightr = this[right.type](right)

    if (rightr.stats === STATS.FAIL) return rightr

    // rightr.stats === STATS.SUCESS
    var list = rightr.value
    if (!isArray(list)) {
      return this.initFailInfo('Right operand of #foreach must be an array.', right.pos)
    }
    if (!node.body) return this.initSuccessInfo()

    var result = this.initSuccessInfo()
    var ctx = {foreach: {}}
    this.pushContext(ctx)

    for (var i = 0; i < list.length; i++) {
      ctx[left.object.name] = list[i]
      ctx.foreach.count = i + 1

      var cr = this[node.body.type](node.body)
      if (cr.stats === STATS.SUCCESS) {
        result.value += cr.value
      } else if (cr.stats === STATS.BREAK) {
        result.value += cr.value
        break
      } else {
        this.mergeResult(result, cr)
        break
      }
    }

    this.popContext()
    return result
  },

  Include: function(node) {
    var that = this
    var args = node.arguments
    var rt = ''
    args.forEach(function(arg) {
      var relPath = that[arg.type](arg)
      if (isNotEmptyStr(relPath)) {
        var fullPath = util.getFullPath(relPath, that.cfg.roots)
        if (fullPath) {
          rt += fs.readFileSync(fullPath, {encoding: that.cfg.encoding})
        } else {
          logger.error('Invalid #include param <%s>.', relPath)
        }
      } else {
        logger.error('Invalid #include param.')
      }
    })
    return rt
  },

  Parse: function(node) {
    var arg = node.argument
    var relPath = this[arg.type](arg)
    if (isNotEmptyStr(relPath)) {
      var fullPath = util.getFullPath(relPath, this.cfg.roots)
      if (fullPath) {
        return this.render(null, relPath)
      } else {
        logger.error('Invalid #parse param <%s>.', relPath)
      }
    } else {
      logger.error('Invalid #parse param.')
    }
  },

  Evaluate: function(node) {
    var arg = node.argument
    var argv = this[arg.type](arg)
    if (isNotEmptyStr(argv)) {
      return this.render(null, argv)
    } else {
      return argv
    }
  },

  Define: function(node) {
    var name = node.name
    var namev = this[name.type](name, true)
    var nameObj = name.object
    if (nameObj.type !== 'Identifier') {
      logger.error('Reference of #define must be id <%s>.', namev.literal)
    }

    namev.object[namev.property]= {
      __type: 'Define',
      __node: node.body
    }

    return ''
  },

  Macro: function(node, isGlobal) {
    var that = this
    node.__arguments = []
    node.arguments.forEach(function(arg) {
      var cnode = arg.object
      if (cnode.type === 'Identifier') {
        node.__arguments.push(cnode.name)
      } else {
        var param = that[cnode.type](cnode)
        logger.error('Parameter of #macro must be id <%s>.', param.literal)
      }
    })

    var macro = isGlobal ? this.macro : this.topContext.__macro
    var name = node.name
    macro[name] = node
    //console.log(isGlobal ? 'Add global macro.': 'Add local macro.', macro)
    return ''
  },

  MacroCall: function(node) {
    var that = this
    var name = node.name
    if (name in this.topContext.__macro) {
      var def = this.topContext.__macro[name]
      if (def.arguments.length !== node.arguments.length) {
        logger.error('Valid number of macro parameters.')
      } else {
        if (!def.body) return ''
        var ctx = {}
        var args = node.arguments
        var argKeys = def.__arguments
        args.forEach(function(arg, idx) {
          ctx[argKeys[idx]] = that[arg.type](arg)
        })
        if (node.isBlock) {
          var body = node.body
          ctx.bodyContent = node.body ? this[body.type](body) : ''
        }
        this.pushContext(ctx)
        var rt = this[def.body.type](def.body)
        this.popContext(ctx)
        return rt
      }
    } else {
      logger.error('Call undefined macro <%s>.', name)
    }
  },


  Stop: function(node) {
    return {
      stats: STATS.STOP,
      value: '',
      template: this.template,
      pos: node.pos
    }
  },

  Break: function(node) {
    return {
      stats: STATS.BREAK,
      value: '',
      template: this.template,
      pos: node.pos
    }
  }
}

function isArray(v) {
  return v && typeof v.length === 'number' && v.forEach
}

function isId(node) {
  return node.type === 'Reference' && node.object.type === 'Identifier'
}

function isNotEmptyStr(input) {
  return typeof input === 'string' && input
}