var util = require('../util')
var logger = require('../logger')

module.exports = {
  If: function(node) {
    var test = node.test
    var testv = this[test.type](test)
    var consequent = node.consequent
    var alternate = node.alternate

    if (testv) {
      if (consequent) {
        return this[consequent.type](consequent)
      } else {
        return ''
      }
    } else {
      if (alternate) {
        return this[alternate.type](alternate)
      } else {
        return ''
      }
    }
  },

  Foreach: function(node) {
    if (!node.body) return ''

    var that = this
    var left = node.left
    var leftObj = left.object
    var key = this[leftObj.type](leftObj).literal
    if (leftObj.type !== 'Identifier') {
      logger.error('Left operand of #foreach must be id <%s>.', key)
    }

    var right = node.right
    var rightv = this[right.type](right)

    var body = node.body

    var rt = ''
    var ctx = {foreach: {}}

    this.pushContext(ctx)
    try{
      rightv.forEach(function(item, idx) {
        ctx[key] = item
        ctx.foreach.count = idx + 1
        rt += that[body.type](body)
      })
    } catch (e) {
      if (e.message !== '__VELOCITY_BREAK') {
        throw e
      }
    }

    this.popContext(ctx)
    return rt
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
    throw new Error('__VELOCITY_STOP')
  },

  Break: function(node) {
    throw new Error('__VELOCITY_BREAK')
  }
}

function isNotEmptyStr(input) {
  return typeof input === 'string' && input
}