var utilx = require('utilx')
var _ = require('lodash')

var common = require('../common')
var logger = require('../logger')

var STATS = require('./data-stats')
var BREAK = { __stats: STATS.BREAK }

module.exports = {

  Reference: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)

    if (objr.__stats === STATS.DEFINE) return BREAK
    return objr
  },

  Identifier: function(node) {
    var name = node.name
    var ctx = this.context
    for (ctx; ctx; ctx = ctx.__parent) {
      if (name in ctx) {
        if (ctx[name].__stats === STATS.LEFT) {
          return ctx[name].__value
        } else {
          return ctx[name]
        }
      }
    }

    this.topContext[name] = { __stats: STATS.UNCERTAIN }
    return this.topContext[name]
  },

  Property: function(node) {
    var isFn = node.__isFunction
    var obj = node.object
    var objr = this[obj.type](obj)
    var stats = objr.__stats

    // stats === STATS.LEFT is impossible

    if (stats === STATS.BREAK) return BREAK
    if (stats === STATS.DEFINE) return BREAK
    if (stats === STATS.CERTAIN_FUNC) return BREAK

    if (stats === STATS.UNCERTAIN) {
      if (!isFn) objr.__stats = STATS.CERTAIN
      objr.__value = {}
    }

    // stats === STATS.CERTAIN || STATS.UNCERTAIN
    var o = objr.__value
    var p = node.property.name

    // NOTE
    //
    // $str.length()
    // ^^^^^^^^^^^
    //
    // $arr.size()
    // ^^^^^^^^^
    //
    // return of both references cannot go further
    // so it is ok when $a is not a object, then BREAK
    if (!_.isObject(o)) return BREAK

    if (!(p in o)) o[p] = { __stats: STATS.UNCERTAIN }

    if (o[p].__stats !== STATS.CERTAIN_FUNC && isFn) {
      o[p].__parent = objr
      o[p].__property = p
    }

    return o[p]
  },

  Index: function(node) {
    var obj = node.object
    var objr = this[obj.type](obj)
    var stats = objr.__stats

    // stats === STATS.LEFT is impossible

    if (stats === STATS.BREAK) return BREAK
    if (stats === STATS.DEFINE) return BREAK
    if (stats === STATS.CERTAIN_FUNC) return BREAK

    var prop = node.property
    this[prop.type](prop)

    if (stats === STATS.UNCERTAIN) {
      if (common.isLiteralString(prop)) {
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

    if (common.isLiteralString(prop)) {
      var p = prop.name
      if (!_.isObject(o)) return BREAK
      if (!o[p]) o[p] = { __stats: STATS.UNCERTAIN }
      return o[p]

    } else if (prop.type === 'Integer' || isCertainArray(objr)) {
      var p = 0
      if (!_.isArray(o)) return BREAK
      if (!o[p]) o[p] = { __stats: STATS.UNCERTAIN }
      return o[p]

    } else {
      return BREAK
    }
  },

  Method: function(node) {
    var callee = node.callee
        callee.__isFunction = true
    var calleer = this[callee.type](callee)
    var stats = calleer.__stats

    var args = node.arguments
    var argsLen = args.length
    for (var i = 0; i < argsLen; i++) {
      var arg = args[i]
      this[arg.type](arg)
    }
    var arg0
    if (argsLen > 0) {
      var temp = args[0]
      if (common.isLiteralString(temp)) {
        arg0 = temp.value
      } else if (temp.type === 'Integer') {
        arg0 = 0
      }
    }

    // stats === STATS.LEFT is impossible

    if (stats === STATS.BREAK) return BREAK
    if (stats === STATS.DEFINE) return BREAK
    if (stats === STATS.CERTAIN) return BREAK

    if (stats === STATS.CERTAIN_FUNC) {
      // defined by user
      if ('__value' in calleer) {
        return BREAK

      // derived from template
      } else {
        return calleer.__return
      }
    }

    //stats === STATS.UNCERTAIN
    var parent = calleer.__parent
    // NOTE
    // from .Property, parent.__value must be a object
    var pIsCertain = parent.__stats === STATS.CERTAIN
    var prop = calleer.__property
    ; delete calleer.__parent
    ; delete calleer.__property

    parent.__stats = STATS.CERTAIN
    if (prop === 'length' && argsLen === 0 && !pIsCertain) {
      parent.__value = ''

    } else if (prop === 'size' && argsLen === 0 && !pIsCertain) {
      parent.__value = []

    } else if (prop === 'isEmpty' && argsLen === 0 && !pIsCertain) {
      parent.__value = []

    } else if (prop === 'entrySet' && argsLen === 0) {
      delete parent.__value[prop]

    } else if (prop === 'keySet' && argsLen === 0) {
      delete parent.__value[prop]

    } else if (prop === 'get' && argsLen == 1) {
      delete parent.__value[prop]

      if (!pIsCertain && utilx.isInteger(arg0)) {
        parent.__value = [{ __stats: STATS.UNCERTAIN }]
        return parent.__value[0]
      } else if (_.isString(arg0)) {
        parent.__value[arg0] = parent.__value[arg0] || { __stats: STATS.UNCERTAIN }
        return parent.__value[arg0]
      }

    } else if (prop.indexOf('get') === 0 && prop.length > 3 && argsLen === 0) {
      delete parent.__value[prop]

      var p = extractProp(prop)
      parent.__value[p] = parent.__value[p] || { __stats: STATS.UNCERTAIN }
      return parent.__value[p]

    } else if (prop.indexOf('is') === 0 && prop.length > 2 && argsLen === 0) {
      delete parent.__value[prop]

      var p = extractProp(prop)
      parent.__value[p] = parent.__value[p] || {
        __stats: STATS.CERTAIN,
        __value: true
      }
      return parent.__value[p]

    // it is really a function
    } else {
      calleer.__stats = STATS.CERTAIN_FUNC
      calleer.__argc = argsLen
      calleer.__return = { __stats: STATS.UNCERTAIN }
      return calleer.__return
    }

    return BREAK
  }
}


function extractProp(s) {
  s = s.replace(/^(get|set|is)/, '')
  return s[0].toLowerCase() + s.substr(1)
}


function isCertainArray(o) {
  return o.__stats === STATS.CERTAIN && _.isArray(o.__value)
}
