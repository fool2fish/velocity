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

  template = template || this.cfg.template
  var fullPath = util.getFullPath(template, this.cfg.roots)
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
    node = parser.parse(template)
  }

  // logger.debug('Ast', node)
  var rt = this[node.type](node)
  if (context) this.popContext(context)
  return rt
}

Engine.prototype.Statements = function(node) {
  var content = ''
  var body = node.body
  for (var i = 0; i < body.length; i++) {
    var cnode = body[i]
    content += this[cnode.type](cnode)
  }
  return content
}

Engine.prototype.Reference = function(node, isLeft) {
  var obj = node.object
  var objv = this[obj.type](obj, isLeft)

  if (isLeft) {
    return objv
  } else {
    if (objv.success) {
      var v = objv.value
      if (v.__type === 'Define') {
        var n = v.__node
        return n ? this[n.type](n) : ''
      } else {
        return v
      }
    } else if (node.silent){
      return ''
    } else {
      var rt = '$'
      if (node.wrapped) rt += '{'
      rt += objv.literal
      if (node.wrapped) rt += '}'
      return rt
    }
  }
}

Engine.prototype.Identifier = function(node, isLeft) {
  var n = node.name

  if (isLeft) {
    return {
      object: this.topContext,
      property: n,
      literal: n
    }

  } else {
    var v = this.get(n)
    return {
      value: v,
      literal: n,
      success: v !== undefined
    }
  }
}

Engine.prototype.Prop = function(node) {
  return node.name
}

Engine.prototype.Property = function(node, isLeft) {
  var obj = node.object
  var objv = this[obj.type](obj)

  var prop = node.property
  var propv = this[prop.type](prop)

  var literal
  if (prop.type === 'Prop') {
    literal =  objv.literal + '.' + propv
  } else {
    literal =  objv.literal + '[' + quotes(propv) + ']'
  }

  if (!validateProp(propv)) logger.error('Property <%s> must be integer or string.', literal)

  var rt = {
    literal: literal
  }
  if (isLeft) {
    if (validateObj(objv)) {
      rt.object = objv.value
      rt.property = propv
    } else {
      logger.error('Illegal left hand of assignment expression <%s>.', literal)
    }
  } else {
    rt.success = false
    if (validateObj(objv)) {
      var v = objv.value[propv]
      if (v !== undefined) {
        rt.value = v
        rt.success = true
      }
    }
  }

  return rt
}

Engine.prototype.Index = Engine.prototype.Property

Engine.prototype.Method = function(node, isLeft) {
  var that = this
  var callee = node.callee
  var calleev = this[callee.type](callee)

  if (isLeft) {
    logger.error('Method <%s()> cannot be left hand of assignment expression.', calleev.literal)

  } else {
    var args = node.arguments
    var argsv = []
    args.forEach(function(arg) {
      argsv.push(that[arg.type](arg))
    })

    var rt = {
      literal: calleev.literal + '(' + quotes(argsv).join(', ') + ')',
      success: false
    }
    if (calleev.success && typeof calleev.value === 'function') {
      var v = calleev.value.apply(null, argsv)
      if (v !== undefined) {
        rt.value = v
        rt.success = true
      }
    }
    return rt
  }
}

Engine.prototype.Range = function(node) {
  var start = node.start
  var startv = this[start.type](start)

  var end = node.end
  var endv = this[end.type](end)

  if (isInteger(startv) && isInteger(endv)) {
    return generateList(startv, endv)
  } else {
    logger.error('Start and end of range must be integer.', {start: startv, end: endv})
  }
}

Engine.prototype.List = function(node) {
  var that = this
  var rt = []
  node.elements.forEach(function(element) {
    rt.push(that[element.type](element))
  })
  return rt
}

Engine.prototype.Map = function(node) {
  var that = this
  var rt = {}
  node.mapItems.forEach(function(mapItem) {
    var prop = mapItem.property
    var propv = that[prop.type](prop)

    var value = mapItem.value
    var valuev = that[value.type](value)

    if (validateProp(propv)) {
      rt[propv] = valuev
    } else {
      logger.error('Illegal key of map <%s>.', propv)
    }
  })
  return rt
}

Engine.prototype.UnaryExpr = function(node) {
  var argument = node.argument
  var argumentv = this[argument.type](argument)
  return !argumentv
}

Engine.prototype.BinaryExpr = function(node) {
  var left = node.left
  var leftv = this[left.type](left)

  var right = node.right
  var rightv = this[right.type](right)

  var op = node.operator
  if      (op === '*')  { return leftv * rightv}
  else if (op === '/')  {
    if (rightv === 0) {logger.error('Right operand cannot be zero in division operation (/).')}
    return leftv / rightv
  }
  else if (op === '%')  {
    if (rightv === 0) {logger.error('Right operand cannot be zero in modulo operation (%).')}
    return leftv % rightv
  }
  else if (op === '+')  { return leftv +  rightv }
  else if (op === '-')  { return leftv -  rightv }
  else if (op === '>=') { return leftv >= rightv }
  else if (op === '>')  { return leftv >  rightv }
  else if (op === '<=') { return leftv <= rightv }
  else if (op === '<')  { return leftv <  rightv }
  else if (op === '==') { return leftv == rightv }
  else if (op === '!=') { return leftv != rightv }
  else if (op === '&&') { return leftv && rightv }
  else if (op === '||') { return leftv || rightv }
}

Engine.prototype.AssignExpr = function(node) {
  var left = node.left
  var leftv = this[left.type](left, true)
  var right = node.right
  var rightv = this[right.type](right)
  leftv.object[leftv.property] = rightv
  logger.debug('AssignExpr', this.topContext)
  return ''
}

Engine.prototype.DString = function(node) {
  return this.render(null, node.value)
}

Engine.prototype.If = function(node) {
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
}

Engine.prototype.Foreach = function(node) {
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
  rightv.forEach(function(item, idx) {
    ctx[key] = item
    ctx.foreach.count = idx
    rt += that[body.type](body)
  })
  this.popContext(ctx)

  return rt
}

Engine.prototype.Include = function(node) {
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
}

Engine.prototype.Parse = function(node) {
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
}

Engine.prototype.Evaluate = function(node) {
  var arg = node.argument
  var argv = this[arg.type](arg)
  if (isNotEmptyStr(argv)) {
    return this.render(null, argv)
  } else {
    return argv
  }
}

Engine.prototype.Define = function(node) {
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
}

Engine.prototype.Macro = function(node, isGlobal) {
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
}

Engine.prototype.MacroCall = function(node) {
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
      this.pushContext(ctx)
      var rt = this[def.body.type](def.body)
      this.popContext(ctx)
      return rt
    }
  } else {
    logger.error('Call undefined macro <%s>.', name)
  }
}

Engine.prototype.Stop = function(node) {

}

Engine.prototype.Break = function(node) {

}


Engine.prototype.Boolean = literal
Engine.prototype.Null = literal
Engine.prototype.Integer = literal
Engine.prototype.Float = literal
Engine.prototype.String = literal
Engine.prototype.Text = literal
Engine.prototype.BText = literal

Engine.prototype.Comment = empty
Engine.prototype.BComment = empty


function literal(node) {
  return node.value
}

function empty(node) {
  return ''
}

function isInteger(v) {
  if (typeof v !== 'number') return false
  if (Math.floor(v) !== Math.ceil(v)) return false
  return true
}

function validateObj(objv) {
  if (objv.success) {
    var v = objv.value
    if (!v) return false
    if (typeof v === 'boolean') return false
    if (typeof v === 'number') return false
    if (typeof v === 'string') return false
  } else {
    return false
  }
  return true
}

function validateProp(propv) {
  if (isInteger(propv) && propv >=0) return true
  if (typeof propv === 'string' && propv) return true
  return false
}

function isNotEmptyStr(input) {
  return typeof input === 'string' && input
}

// [0..3] -> [0, 1, 2, 3]
function generateList(start, end) {
  var rt = []
  var sign = start <= end ? 1 : -1
  var i
  for (i = start; (i - end) * sign <= 0; i += sign) {
    rt.push(i)
  }
  return rt
}

// 'string' -> "'string'"
// other    -> other
// ['string', 1, false] -> ["'string'", 1, false]
function quotes(input) {
  if (!input) return input
  if (input.length && input.map) {
    return input.map(function(item) {
      return singleQuotes(item)
    })
  } else {
    return singleQuotes(input)
  }
}

function singleQuotes(input) {
  if (typeof input === 'string') {
    return "'" + input + "'"
  } else {
    return input
  }
}

module.exports = Engine






