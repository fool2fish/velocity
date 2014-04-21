var utilx = require('utilx')

var logger = require('../logger')
var STATS = require('./engine-stats')


module.exports = {
  Range: function(node) {
    var start = node.start
    var startr = this[start.type](start)
    if (startr.stats === STATS.FAIL) return startr
    if (!utilx.isInteger(startr.value)) {
      return this.initFailInfo('Start of range is not an integer.', start.pos)
    }

    var end = node.end
    var endr = this[end.type](end)

    if (endr.stats === STATS.FAIL) return endr
    if (!utilx.isInteger(endr.value))
      return this.initFailInfo('End of range is not an integer.', end.pos)

    return {
      stats: STATS.SUCCESS,
      value: generateList(startr.value, endr.value)
    }
  },

  List: function(node) {
    var list = []
    for (var i = 0; i < node.elements.length; i++) {
      var el = node.elements[i]
      var elr = this[el.type](el)

      if (elr.stats === STATS.FAIL) return elr
      list.push(elr.value)
    }
    return {
      stats: STATS.SUCCESS,
      value: list
    }
  },

  Map: function(node) {
    var map = {}

    for (var i = 0; i < node.mapItems.length; i++) {
      var mapItem = node.mapItems[i]

      var prop = mapItem.property
      var propr = this[prop.type](prop)

      if (propr.stats === STATS.FAIL) return propr
      if (!utilx.isNonEmptyString(propr.value))
        return this.initFailInfo('Key of map is not a non-empty string.', prop.pos)

      var value = mapItem.value
      var valuer = this[value.type](value)

      if (valuer.stats === STATS.FAIL) return valuer
      map[propr.value] = valuer.value
    }

    return {
      stats: STATS.SUCCESS,
      value: map
    }
  },

  UnaryExpr: function(node) {
    var arg = node.argument
    var argr = this[arg.type](arg)

    if (argr.stats === STATS.FAIL) return argr

    return {
      stats: STATS.SUCCESS,
      value: !argr.value
    }
  },

  BinaryExpr: function(node) {
    var left = node.left
    var leftr = this[left.type](left)

    if (leftr.stats === STATS.FAIL) return leftr

    var leftv = leftr.value
    var op = node.operator

    if (leftv && op === '||') {
      return {
        stats: STATS.SUCCESS,
        value: true
      }
    }
    if (!leftv && op === '&&') {
      return {
        stats: STATS.SUCCESS,
        value: false
      }
    }

    var right = node.right
    var rightr = this[right.type](right)

    if (rightr.stats === STATS.FAIL) return rightr

    var v
    var rightv = rightr.value

    if      (op === '*')  { v = leftv * rightv }
    else if (op === '/')  {
      if (rightv === 0) {
        return this.initFailInfo('Right operand of division is zero.', right.pos)
      }
      v = leftv / rightv
    }
    else if (op === '%')  {
      if (rightv === 0) {
        return this.initFailInfo('Right operand of modulo is zero.', right.pos)
      }
      v = leftv % rightv
    }
    else if (op === '+')  { v = leftv +  rightv }
    else if (op === '-')  { v = leftv -  rightv }
    else if (op === '>=') { v = leftv >= rightv }
    else if (op === '>')  { v = leftv >  rightv }
    else if (op === '<=') { v = leftv <= rightv }
    else if (op === '<')  { v = leftv <  rightv }
    else if (op === '==') { v = leftv == rightv }
    else if (op === '!=') { v = leftv != rightv }
    else if (op === '&&') { v = leftv && rightv }
    else if (op === '||') { v = leftv || rightv }

    return {
      stats: STATS.SUCCESS,
      value: v
    }
  },

  AssignExpr: function(node) {
    var left = node.left
    if (left.object.type !== 'Identifier') {
      return this.initFailInfo('Left operand of assignment expression is not an identifier.', left.pos)
    }
    var property = left.object.name

    var right = node.right
    var rightr = this[right.type](right)
    if (rightr.stats === STATS.FAIL) return rightr

    this.topContext[property] = rightr.value

    return this.initSuccessInfo()
  },

  DString: function(node) {
    var result = this.Render(null, {isFile: false, raw: node.value})
    if (result.stats !== STATS.SUCCESS) {
      result.stats = STATS.FAIL
      result.message = result.message || 'Illegal #break or #stop.'
      result.stack.pop()
      result.stack.push([this.template, node.pos])
    }
    return result
  },


  Boolean: literal,
  Null: literal,
  Integer: literal,
  Float: literal,
  String: literal,
  Text: literal,
  BText: literal,

  Comment: empty,
  BComment: empty
}

function literal(node) {
  return {
    stats: STATS.SUCCESS,
    value: node.value
  }
}

function empty(node) {
  return {
    stats: STATS.SUCCESS,
    value: ''
  }
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



