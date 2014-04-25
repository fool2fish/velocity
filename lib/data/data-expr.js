var utilx = require('utilx')

var logger = require('../logger')
var common = require('../common')
var STATS = require('./data-stats')


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
    var name = left.object.name

    var right = node.right
    var rightr = this[right.type](right)

    var cur = this.topContext[name]
    var origin = common.getOrigin(cur)

    this.topContext[name] = {
      __stats: STATS.LEFT,
      __value: rightr || { __stats: STATS.BREAK },
      __origin: origin
    }
  },

  DString: function(node) {
    this.Extract(null, {
      isFile: false,
      raw: node.value,
      offset: this.template.offset || node.pos
    })
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



