var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')
var TYPE = require('./data-type')

module.exports = {

  Reference: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)

    if (isTerminate(objr)) return objr

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

    if (isTerminate(objr)) return objr
    return addItem(objr, prop.name)
  },

  Index: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var prop = node.property

    if (isTerminate(objr)) return objr

    // object
    if (common.isLiteralString(prop)) {
      return addItem(objr, prop.value)

    // array
    } else {
      this[prop.type](prop)
      return addItem(objr)
    }
  },

  Method: function(node) {
    var callee = node.callee
    var calleer = this[callee.type](callee)

    if (isTerminate(calleer)) return calleer

    var args = node.arguments
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      this[arg.type](arg)
    }

    var rt = { type: TYPE.FINALITY }

    if (calleer.type !== TYPE.FUNCTION) {
      var o = calleer.object
      var p = calleer.property
      var l = args.length
      var arg0 = args[0]
      var arg1 = args[1]

      // string.length() -> string.length
      var arr = ['length', 'size', 'isEmpty', 'entrySet', 'keySet']
      if (arr.indexOf(p) !== -1 && l === 0) return rt

      // array.get(idx) -> array[idx]
      // object.get(key) -> object[key]
      if (p === 'get' && l === 1) {
        // object
        if (common.isLiteralString(prop)) {
          return addItem(objr, prop.value)

        // array
        } else {
          this[prop.type](prop)
          return addItem(objr)
        }
      }

      // array.getIdx() -> array[idx]
      // object.getKey() -> object[key]
      if (p.indexOf('get') === 0 && p.length > 3 && l === 0) {
        return addItem(objr, extractProp(p))
      }

      // object.isKey() -> object[key]
      if (p.indexOf('is') === 0 && p.length > 2 && l === 0) {
        return addItem(objr, extractProp(p))
      }

      o[p] = function() {}
      return rt
    }

    return rt
  }
}


function extractProp(v) {
  v = v.replace(/^(get|set|is)/, '')
  return v[0].toLowerCase() + v.substr(1)
}

function isTerminate(obj) {
  return  obj.type === TYPE.FINALITY || obj.type === TYPE.METHOD
}

function addItem(obj, prop) {
  var t
  var o = obj.object
  var p = obj.property
  var v = o[p]
  var isObj = utilx.isObject(v)
  var isArr = utilx.isArray(v)

  if (prop === undefined) {
    // for $a.b $a[$c]
    if (isObj) {
      return {
        type: TYPE.FINALITY,
        object: o,
        property: p
      }

    } else {
      prop = 0
      t = TYPE.ARRAY
      if (!isArr) o[p] = []
    }

  } else {
    if (!utilx.isObject(o[p])) o[p] = {}
    t = TYPE.OBJECT
  }

  return {
    type: t,
    object: o[p],
    property: prop
  }
}

function getType(v) {
  if (utilx.isFunction(v)) return TYPE.FUNCTION
  if (utilx.isObject(v)) return TYPE.OBJECT
  if (utilx.isArray(v)) return TYPE.ARRAY
  return TYPE.LITERAL
}

