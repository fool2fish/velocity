var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')
var TYPE = require('./data-type')
var STATS = require('./data-stats')
var BREAK = { __stats: STATS.BREAK }

module.exports = {

  Reference: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)

    // TODO handle define

    return objr
  },

  Identifier: function(node) {
    var name = node.name
    var ctx = this.context
    for (ctx; ctx; ctx = ctx.__parent) {
      if (name in ctx) return ctx[name]
    }

    this.topContext[name] = { __stats: STATS.UNCERTAIN }
    return this.topContext[name]
  },

  Property: function(node) {
    // TODO handle method look up

    var obj = node.object
    var objr = this[obj.type](obj)
    var stats = objr.__stats

    // stats === STATS.LEFT is impossible

    if (stats === STATS.BREAK) return objr
    if (stats === STATS.DEFINE) return BREAK

    if (stats === STATS.UNCERTAIN) {
      objr.__stats = STATS.CERTAIN
      objr.__value = {}
    }

    // stats === STATS.CERTAIN
    var o = objr.__value
    var p = node.property.name

    if (!utilx.isObject(o)) return BREAK
    if (!o[p]) o[p] = { __stats: STATS.UNCERTAIN }
    return o[p]
  },

  Index: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var stats = objr.__stats

    if (stats === STATS.BREAK) return objr
    if (stats === STATS.DEFINE) return BREAK

    var prop = node.property
    this[prop.type](prop)

    if (stats === STATS.UNCERTAIN) {
      if (isLiteralString(prop)) {
        objr.__stats = STATS.CERTAIN
        objr.__value = {}

      } else if (prop.type === 'Integer') {
        objr.__stats = STATS.CERTAIN
        objr.__value = []

      } else {
        objr.__value = []
      }
    }

    var o = objr.__value

    if (isLiteralString(prop)) {
      var p = prop.name
      if (!utilx.isObject(o)) return BREAK
      if (!o[p]) o[p] = { __stats: STATS.UNCERTAIN }
      return o[p]

    } else if (prop.type === 'Integer' || isCertainArray(objr)) {
      var p = 0
      if (!utilx.isArray(o)) return BREAK
      if (!o[p]) o[p] = { __stats: STATS.UNCERTAIN }
      return o[p]

    } else {
      return BREAK
    }
  },

  Method: function(node) {
    var callee = node.callee
    var calleer = this[callee.type](callee)

    var args = node.arguments
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      this[arg.type](arg)
    }

    var t = calleer.type
    if (t === TYPE.BREAK) return calleer

    var rt = { type: TYPE.BREAK }
    // NOTE
    // $a.b...
    //    ^
    // .b may pointer to a function
    // considering those method looking up rules
    // property 'prev' pointer to returning of $a is add to return of $a.b
    if (!calleer.prev) return rt

    var o = calleer.object
    var p = calleer.property
    var v = o[p]

    var prev = calleer.prev
    var po = prev.object
    var pp = prev.property
    var pv = prev.value

    var l = args.length
    var arg0 = args[0]

    if (p === 'length' && l === 0) {
      po[pp] = utilx.isString(pv) ? pv : ''

    } else if (['size', 'isEmpty'].indexOf(p) !== -1 && l === 0) {
      po[pp] = utilx.isArray(pv) ? pv : []

    } else if (['entrySet', 'keySet'].indexOf(p) !== -1 && l === 0) {

    } else if (p === 'get' && l === 1) {
      return addItem(prev, arg0)

    } else if (p.indexOf('get') === 0 && p.length > 3 && l === 0) {
      return addItem(prev, extractProp(p))

    } else if (p.indexOf('is') === 0 && p.length > 2 && l === 0) {
      return addItem(prev, extractProp(p))

    } else {
      o[p] = function() {return ''}
    }

    return rt
  }
}


function extractProp(s) {
  s = s.replace(/^(get|set|is)/, '')
  return s[0].toLowerCase() + s.substr(1)
}

function isLiteralString(n) {
  if (n.type === 'String') return true
  if (n.type === 'DString' && n.value.search(/\$|#/) === -1) return true
  return false
}

function isCertainArray(o) {
  return o.__stats === STATS.CERTAIN && utilx.isArray(o.__value)
}
