var utilx = require('utilx')
var _ = require('lodash')

var common = require('../common')
var logger = require('../logger')
var STATS = require('./engine-stats')


module.exports = {

  Reference: function(node) {
    // call define
    if (common.isId(node)) {
      var name = node.object.name
      if (name in this.template.__define) {
        var def = this.template.__define[name]
        var result = this[def.type](def)
        if (result.stats !== STATS.SUCCESS) {
          // at where the #define is called
          result.stack.push(common.getRealLoc([this.template, node.pos]))
        }
        return result
      }
    }

    var obj = node.object
    var objr = this[obj.type](obj)

    if (objr.stats !== STATS.SUCCESS) return objr

    var v = objr.value
    if (v === undefined || v === null) {
      var result = {
        stats: STATS.SUCCESS,
        value: v,
        silent: node.silent
      }
      if (!node.silent) result.literal = common.extractContent(this.template.lines, node.pos)
      return result
    } else {
      return objr
    }
  },

  Identifier: function(node) {
    var v
    var name = node.name
    var ctx = this.context
    for (ctx; ctx; ctx = ctx.__parent) {
      if (name in ctx) {
        v = ctx[name]
        break
      }
    }
    return {
      stats: STATS.SUCCESS,
      value: v
    }
  },

  Prop: function(node) {
    return {
      stats: STATS.SUCCESS,
      value: node.name
    }
  },

  Property: PropIdx,
  Index: PropIdx,

  Method: function(node) {
    var callee = node.callee
    var calleer = this[callee.type](callee)

    if (calleer.stats !== STATS.SUCCESS) return calleer

    var args = node.arguments
    var argsv = []

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      var argr = this[arg.type](arg)

      if (argr.stats !== STATS.SUCCESS) return argr
      argsv.push(argr.value)
    }

    if (!_.isFunction(calleer.value)) {
      var o = calleer.object
      var p = calleer.property
      var l = argsv.length

      // string.length() -> string.length
      if (_.isString(o) && p === 'length' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: calleer.value
        }
      }

      // array.size() -> array.length
      if (_.isArray(o) && p === 'size' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: o.length
        }
      }

      // array.isEmpty() -> !array.length
      if (_.isArray(o) && p === 'isEmpty' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: !o.length
        }
      }

      // object.entrySet() -> [{key: k, value: v}, ...]
      if (_.isObject(o) && p === 'entrySet' && l === 0) {
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
      if (_.isObject(o) && p === 'keySet' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: Object.keys(o)
        }
      }


      var isArrOrObj = _.isArray(o) || _.isObject(o)
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

      // object.getKey() -> object[key]
      if (isArrOrObj && p.indexOf('get') === 0 && p.length > 3 && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: o[extractProp(p)]
        }
      }

      // array.set(idx, value) -> array[idx] = value
      // object.set(key, value) -> object[key] = value
      // if (isArrOrObj && p === 'set' && l === 2 && validateProp(arg0)) {
      //   o[arg0] = arg1
      //   return this.initSuccessInfo()
      // }

      // array.setIdx(value) -> array[idx] = value
      // object.setKey(value) -> object[key] = value
      // if (isArrOrObj && p.indexOf('set') === 0 && p.length > 3 && l === 1) {
      //   o[extractProp(p)] = arg0
      //   return this.initSuccessInfo()
      // }

      // object.isKey() -> object[key]
      if (_.isObject(o) && p.indexOf('is') === 0 && p.length > 2 && l === 0) {
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


function PropIdx(node) {
  var obj = node.object
  var objr = this[obj.type](obj)
  var objv = objr.value

  if (objr.stats !== STATS.SUCCESS) return objr

  var prop = node.property
  var propr = this[prop.type](prop)
  var propv = propr.value

  if (propr.stats !== STATS.SUCCESS) return propr
  if (!validateProp(propr.value)) return this.initSuccessInfo()

  return {
    stats: STATS.SUCCESS,
    value: (objv || objv === '') ? objv[propv] : undefined,
    object: objv,
    property: propv
  }
}


function validateProp(v) {
  if (utilx.isInteger(v) && v >=0) return true
  if (_.isString(v) && v) return true
  return false
}

function extractProp(v) {
  v = v.replace(/^(get|set|is)/, '')
  return v[0].toLowerCase() + v.substr(1)
}
