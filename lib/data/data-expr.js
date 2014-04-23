var utilx = require('utilx')

var logger = require('../logger')
var common = require('../common')
var STATS = require('../engine/engine-stats')


module.exports = {
  Range: function(node) {
    var start = node.start
    this[start.type](start)

    var end = node.end
    this[end.type](end)
  },

  List: function(node) {
    for (var i = 0; i < node.elements.length; i++) {
      var el = node.elements[i]
      this[el.type](el)
    }
  },

  Map: function(node) {
    for (var i = 0; i < node.mapItems.length; i++) {
      var mapItem = node.mapItems[i]

      var prop = mapItem.property
      this[prop.type](prop)

      var value = mapItem.value
      this[value.type](value)
    }
  },

  UnaryExpr: function(node) {
    var arg = node.argument
    this[arg.type](arg)
  },

  BinaryExpr: function(node) {
    var left = node.left
    this[left.type](left)

    var right = node.right
    this[right.type](right)
  },

  AssignExpr: function(node) {
    var left = node.left
    if (!common.isId(left)) {
      this.throwError('Left operand of assignment expression is not an identifier.', left.pos)
    }

    var right = node.right
    var rightr = this[right.type](right)

    this.userContext[left.object.name] = rightr || {type: TYPE.STOP}
  },

  DString: function(node) {
    this.Extract(null, {isFile: false, raw: node.value})
  },


  Boolean: noop,
  Null: noop,
  Integer: noop,
  Float: noop,
  String: noop,
  Text: noop,
  BText: noop,

  Comment: noop,
  BComment: noop
}


function noop(node) {}



