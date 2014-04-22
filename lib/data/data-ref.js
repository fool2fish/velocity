var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')
var TYPE = require('./data-type')

module.exports = {

  Reference: function(node) {
    var obj = node.object
    return this[obj.type](obj)
  },

  Identifier: function(node) {
    var o = this.topContext
    var k = node.name

    if (k in this.userContext) {

    } else {
      return addItem(o, k)
    }
  },

  Property: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var prop = node.property

    if (objr.type !== TYPE.OBJECT) {
      objr.object[objr.property] = {}
    }
    return addItem(objr.object[objr.property], prop.name)
  },

  Index: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var prop = node.property

    // object
    if (common.isLiteralString(prop)) {
      if (objr.type !== TYPE.OBJECT) {
        objr.object[objr.property] = {}
      }
      return addItem(objr.object[objr.property], prop.value)

    // array
    } else {
      this[prop.type](prop)
      if (objr.type !== TYPE.ARRAY) {
        objr.object[objr.property] = []
      }
      return addItem(objr.object[objr.property])
    }

  },

  Method: function(node) {
    var callee = node.callee
    var calleer = this[callee.type](callee)

    if (calleer.stats === STATS.FAIL) return calleer

    var args = node.arguments
    var argsv = []

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      var argr = this[arg.type](arg)

      if (argr.stats === STATS.SUCCESS) {
        argsv.push(argr.value)

      // argr.stats === STATS.FAIL
      } else {
        return argr
      }
    }

    if (!utilx.isFunction(calleer.value)) {
      var o = calleer.object
      var p = calleer.property
      var l = argsv.length

      // string.length() -> string.length
      if (utilx.isString(o) && p === 'length' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: calleer.value
        }
      }

      // array.size() -> array.length
      if (utilx.isArray(o) && p === 'size' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: o.length
        }
      }

      // array.isEmpty() -> !array.length
      if (utilx.isArray(o) && p === 'isEmpty' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: !o.length
        }
      }

      // object.entrySet() -> [{key: k, value: v}, ...]
      if (utilx.isObject(o) && p === 'entrySet' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: Object.keys(o).map(function(k) {
            return {
              key: k,
              value: o[k]
            }
          })
        }
      }

      // object.keySet() -> [key1, key2, ...]
      if (utilx.isObject(o) && p === 'keySet' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: Object.keys(o)
        }
      }


      var isArrOrObj = utilx.isArray(o) || utilx.isObject(o)
      var arg0 = argsv[0]
      var arg1 = argsv[1]

      // array.get(idx) -> array[idx]
      // object.get(key) -> object[key]
      if (isArrOrObj && p === 'get' && l === 1 && validateProp(arg0)) {
        return {
          stats: STATS.SUCCESS,
          value: o[arg0]
        }
      }

      // array.getIdx() -> array[idx]
      // object.getKey() -> object[key]
      if (isArrOrObj && p.indexOf('get') === 0 && p.length > 3 && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: o[extractProp(p)]
        }
      }

      // array.set(idx, value) -> array[idx] = value
      // object.set(key, value) -> object[key] = value
      if (isArrOrObj && p === 'set' && l === 2 && validateProp(arg0)) {
        o[arg0] = arg1
        return this.initSuccessInfo()
      }

      // array.setIdx(value) -> array[idx] = value
      // object.setKey(value) -> object[key] = value
      if (isArrOrObj && p.indexOf('set') === 0 && p.length > 3 && l === 1) {
        o[extractProp(p)] = arg0
        return this.initSuccessInfo()
      }

      // object.isKey() -> object[key]
      if (utilx.isObject(o) && p.indexOf('is') === 0 && p.length > 2 && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: !!o[extractProp(p)]
        }
      }

      return {
        stats: STATS.SUCCESS,
        value: undefined
      }
    }

    try {
      var result = calleer.value.apply(calleer.object, argsv)
      // let return of set method be empty string
      if (result === undefined && calleer.property.indexOf('set') === 0) result = ''
      return {
        stats: STATS.SUCCESS,
        value: result
      }
    } catch (e) {
      return this.initFailInfo('Function calling error: ' + e.message, node.pos)
    }
  }
}


function validateProp(v) {
  if (utilx.isInteger(v) && v >=0) return true
  if (utilx.isString(v) && v) return true
  return false
}

function extractProp(v) {
  v = v.replace(/^(get|set|is)/, '')
  return v[0].toLowerCase() + v.substr(1)
}

function addItem(o, k) {
  if (k === undefined) {
    k = 0
    if (o[k] === undefined) o[k] = ''
  } else {
    if (!(k in o)) o[k] = ''
  }

  var v = o[k]
  var t = getType(v)
  return {
    type: t,
    object: o,
    property: k
  }
}

function getType(v) {
  if (utilx.isFunction(v)) return TYPE.FUNCTION
  if (utilx.isObject(v)) return TYPE.OBJECT
  if (utilx.isArray(v)) return TYPE.ARRAY
  return TYPE.STRING
}

