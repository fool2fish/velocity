var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')
var TYPE = require('./data-type')

module.exports = {

  Reference: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)

    if (common.isBreak(objr)) return objr

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
        type: TYPE.OBJECT,
        object: o,
        property: p
      }
    }
  },

  Property: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var prop = node.property

    if (common.isBreak(objr)) return objr
    return addItem(objr, prop.name)
  },

  Index: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var prop = node.property
    var propr = this[prop.type](prop)

    if (common.isBreak(objr)) return objr

    if (common.isLiteralString(prop)) {
      return addItem(objr, prop.value)
    } else {
      return addItem(objr)
    }
  },

  Method: function(node) {
    var callee = node.callee
    var calleer = this[callee.type](callee)

    if (common.isBreak(calleer)) return calleer

    var args = node.arguments
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      this[arg.type](arg)
    }

    var rt = { type: TYPE.FINALITY }

    var o = calleer.object
    var p = calleer.property
    var v = o[p]
    var prev = calleer.prev
    var po = prev.object
    var pp = prev.property
    var pv = prev.value
    var l = args.length
    var arg0 = args[0]

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

function addItem(obj, prop) {
  var o = obj.object
  var p = obj.property
  var v = o[p]
  var isObj = utilx.isObject(v)
  var isArr = utilx.isArray(v)

  if (prop === undefined) {
    // $a.b is known as a object, then meets $a.b[$c]
    if (isObj) {
      return {
        type: TYPE.FINALITY,
        object: o,
        property: p
      }

    } else {
      if (!isArr) o[p] = []
      return {
        type: TYPE.ARRAY,
        object: o[p],
        property: 0
      }
    }

  } else {
    if (!isObj) o[p] = {}
    obj.value = v

    return {
      type: TYPE.OBJECT,
      object: o[p],
      property: prop,
      prev: obj
    }
  }
}

function getType(v) {
  if (utilx.isFunction(v)) return TYPE.FUNCTION
  if (utilx.isObject(v)) return TYPE.OBJECT
  if (utilx.isArray(v)) return TYPE.ARRAY
  return TYPE.LITERAL
}

