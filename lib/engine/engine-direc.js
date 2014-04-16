var fs = require('fs')
var iconv = require('iconv-lite')

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
      return this.initFailInfo('Left operand of #foreach is not an identifier.', left.pos)
    }

    var right = node.right
    var rightr = this[right.type](right)

    if (rightr.stats === STATS.FAIL) return rightr

    // rightr.stats === STATS.SUCESS
    var list = rightr.value
    if (!util.isArray(list)) {
      return this.initFailInfo('Right operand of #foreach is not an array.', right.pos)
    }
    if (!node.body) return this.initSuccessInfo()

    var result = this.initSuccessInfo()
    var ctx = {foreach: {}}
    this.pushContext(ctx)

    for (var i = 0; i < list.length; i++) {
      ctx[left.object.name] = list[i]
      ctx.foreach.index = i
      ctx.foreach.count = ctx.velocityCount = i + 1
      ctx.foreach.hasNext = i < list.length - 1

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
    var args = node.arguments
    var result = this.initSuccessInfo()

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      var argr = this[arg.type](arg)

      if (argr.stats === STATS.FAIL) {
        this.mergeResult(result, argr)
        break
      }

      //  argr.stats === STATS.SUCCESS
      var relPath = argr.value
      if (!isNonEmptyStr(relPath)) {
        var fail =  this.initFailInfo('Param of #include is not a non-empty string.', arg.pos)
        this.mergeRessult(result, fail)
        break
      }

      var fullPath = util.getFullPath(relPath, this.cfg.root)
      if (fullPath) {
        var buf = fs.readFileSync(fullPath)
        result.value += iconv.decode(buf, this.cfg.encoding)
      } else {
        var fail = this.initFailInfo('Param of #include not exists or is not subpath of root.', arg.pos)
        this.mergeRessult(result, fail)
        break
      }
    }
    return result
  },

  Parse: function(node) {
    var arg = node.argument
    var argr = this[arg.type](arg)

    if (argr.stats === STATS.FAIL) return argr

    // argr.stats === STATS.SUCCESS
    var relPath = argr.value
    if (!isNonEmptyStr(relPath))
      return this.initFailInfo('Param of #parse is not a non-empty string.', arg.pos)

    var fullPath = util.getFullPath(relPath, this.cfg.root)
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
    var argr = this[arg.type](arg)

    if (argr.stats === STATS.FAIL) return argr

    // argr.stats === STATS.SUCCESS
    var v = argr.value
    if (typeof v !== 'string')
      return this.initFailInfo('Param of #parse is not a string.', node.pos)

    if (!v) return this.initSuccessInfo()

    var result = this.Render(null, {ifFile: false, raw: v})
    if (result.stats === STATS.FAIL) {
      return this.initFailInfo('Evaluate error (' + result.message + ').', node.pos)
    } else if (result.stats === STATS.BREAK || result.stats === STATS.STOP) {
      return this.initFailInfo('Illegal #break or #stop.', node.pos)
    } else {
      return result
    }
  },

  Define: function(node) {
    var name = node.name

    if (!isId(name)) {
      return this.initFailInfo('Param of #define is not an identifier.', name.pos)
    }

    this.topContext[name.object.name] = {
      __type: 'Define',
      __node: node.body,
      __template: this.template
    }

    return this.initSuccessInfo()
  },

  Macro: function(node, templ) {
    node.__arguments = []
    var args = node.arguments
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      if (!isId(arg)) {
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

    // special for alipay's cmsparse
    if (name === 'cmsparse') {
      var arg = node.arguments[0]
      var argr = this[arg.type](arg)

      if (argr.stats === STATS.FAIL) return argr

      var relPath = argr.value
      if (!isNonEmptyStr(relPath))
        return this.initFailInfo('Param of #cmsparse is not a non-empty string.', arg.pos)

      var fullPath = util.getFullPath(relPath, this.cfg.root)
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
        return this.initFailInfo('Param of #cmsparse not exists or is not subpath of root.', arg.pos)
      }
    }

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


  Stop: function(node) {
    return {
      stats: STATS.STOP,
      value: '',
      stack: [[this.template], node.pos]
    }
  },

  Break: function(node) {
    return {
      stats: STATS.BREAK,
      value: '',
      stack: [[this.template], node.pos]
    }
  }
}


function isId(node) {
  return node.object.type === 'Identifier'
}

function isNonEmptyStr(input) {
  return input && typeof input === 'string'
}