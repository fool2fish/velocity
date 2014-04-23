var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')
var TYPE = require('./data-type')

module.exports = {

  Reference: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)

    var t
    var o = objr.object
    var p = objr.property
    var v = o[p]

    if (v === undefined) {
      o[p] = ''
      t = TYPE.LITERAL
    } else {
      t = getType(v)
    }

    return {
      type: t,
      object: o,
      property: p
    }
  },

  Identifier: function(node) {
    var o = this.topContext
    var p = node.name

    if (p in this.userContext) {

    } else {
      return {
        type: getType(o[p]),
        object: o,
        property: p
      }
    }
  },

  Property: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    return addItem(objr, node.property)
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

    var o = calleer.object
    var p = calleer.property
    var v = o[p]

    var prev = calleer.prev
    var po = prev.object
    var pp = prev.property
    var pv = prev.value

    var l = args.length
    var arg0 = args[0]

    var rt = {
      type: TYPE.BREAK,
      object: o,
      property: p
    }

    if (utilx.isFunction(v)) return rt

    if (p === 'length' && l === 0) {
      po[pp] = utilx.isString(pv) ? pv : ''

    } else if (['size', 'isEmpty'].indexOf(p) !== -1 && l === 0) {
      po[pp] = utilx.isArray(pv) ? pv : []

    } else if (['entrySet', 'keySet'].indexOf(p) !== -1 && l === 0) {
      // do nothing

    } else if (p === 'get' && l === 1) {
      if (common.isLiteralString(arg0)) {
        return addItem(prev, arg0.value)
      } else {
        return addItem(prev)
      }

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
      return {
        type: getType(v[prop]),
        object: v,
        property: prop
      }

    // $a.b.c $a.b[$c]
    } else {
      obj.type = TYPE.BREAK
      return obj
    }
  } else { // t === TYPE.UNCERTAIN
    if (isKey) {
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
  if (v === undefined || v === '' || isEmptyObj) return TYPE.UNTERTAIN
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

