var util = require('../util')
var logger = require('../logger')

var eutil = require('./engine-util')
var STATS = require('./engine-stats')


module.exports = {
  Range: function(node) {
    var start = node.start
    var startv = this[start.type](start)

    var end = node.end
    var endv = this[end.type](end)

    if (util.isInteger(startv) && util.isInteger(endv)) {
      return generateList(startv, endv)
    } else {
      logger.error('Start and end of range must be integer.', {start: startv, end: endv})
    }
  },

  List: function(node) {
    var that = this
    var rt = []
    node.elements.forEach(function(element) {
      rt.push(that[element.type](element))
    })
    return rt
  },

  Map: function(node) {
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
  },

  UnaryExpr: function(node) {
    var argument = node.argument
    var argumentv = this[argument.type](argument)
    return !argumentv
  },

  BinaryExpr: function(node) {
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
  },

  AssignExpr: function(node) {
    var left = node.left
    var leftv = this[left.type](left, true)
    var right = node.right
    var rightv = this[right.type](right)
    leftv.object[leftv.property] = rightv
    logger.debug('AssignExpr', this.topContext)
    return ''
  },

  DString: function(node) {
    return this.render(null, node.value)
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
