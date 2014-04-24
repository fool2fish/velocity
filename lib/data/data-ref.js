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

    this.topContext[name] = {
      __stats: STATS.UNCERTAIN,
      __object: this.topContext,
      __property: name
    }
    return this.topContext[name]
  },

  Property: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var stats = objr.__stats

    // stats === STATS.LEFT is impossible

    if (stats === STATS.BREAK) return objr
    if (stats === STATS.DEFINE) return BREAK

    if (stats === STATS.UNCERTAIN) {
      objr.__stats = STATS.CERTAIN
      objr.__value = {}
      ; delete objr.__object
      ; delete objr.__property
    }

    // stats === STATS.CERTAIN
    var o = objr.__value
    var p = node.property.name

    if (!utilx.isObject(o)) return BREAK

    if (!(p in o)) {
      o[p] = {
        __stats: STATS.UNCERTAIN,
        __object: o,
        __property: p
      }
    }
    return o[p]
  },

  Index: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var prop = node.property
    var propr = this[prop.type](prop)
    return addItem(objr, prop)
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


function extractProp(v) {
  v = v.replace(/^(get|set|is)/, '')
  return v[0].toLowerCase() + v.substr(1)
}

// prop:
//   Sting: property of object
//   Integer: index of array
//   undefined: contains variable
function addItem(obj, propNode) {
  var t = obj.type

  if (t === TYPE.BREAK) return obj
  if (t === TYPE.LITERAL || t === TYPE.FUNCTION) {
    obj.type = TYPE.BREAK
    return obj
  }

  var o = obj.object
  var p = obj.property
  var v = o[p]

  var prop
  var isKey
  var isIdx
  if (propNode.type === 'Integer') {
    prop = 0
    isIdx = true
  } else if (utilx.isString(propNode)) {
    prop = propNode
    isKey = true
  } else if (propNode.type === 'Prop') {
    prop = propNode.name
    isKey = true
  } else if (isLiteralString(propNode)) {
    prop = propNode.value
    isKey = false
  }

  if (t === TYPE.ARRAY) {
    // $a.b[0] $a.b.c
    if (isKey) {
      obj.type = TYPE.BREAK
      return obj

    } else {
      return {
        type: getType(v[0]),
        object: v,
        property: 0
      }
    }

  } else if (t === TYPE.OBJECT) {
    if (isKey) {
      obj.value = v
      return {
        type: getType(v[prop]),
        object: v,
        property: prop,
        prev: obj
      }

    // $a.b.c $a.b[$c]
    } else {
      obj.type = TYPE.BREAK
      return obj
    }

  } else { // t === TYPE.UNCERTAIN
    if (isKey) {
      obj.value = v
      o[p] = {}
      return {
        type: TYPE.UNCERTAIN,
        object: o[p],
        property: prop,
        prev: obj
      }
    } else if (isIdx) {
      o[p] = []
      return {
        type: TYPE.UNCERTAIN,
        object: o[p],
        property: 0
      }
    } else {
      obj.type = TYPE.BREAK
      return obj
    }
  }
}

function getType(v) {
  var isObj = utilx.isObject(v)
  var isEmptyObj = isObj && Object.keys(v).length === 0
  if (v === undefined || v === '' || isEmptyObj) return TYPE.UNCERTAIN
  if (utilx.isFunction(v)) return TYPE.FUNCTION
  if (isObj) return TYPE.OBJECT
  if (utilx.isArray(v)) return TYPE.ARRAY
  return TYPE.LITERAL
}

function isLiteralString(node) {
  if (node.type === 'String') return true
  if (node.type === 'DString' && node.value.search(/\$|#/) === -1) return true
  return false
}

