var utilx = require('utilx')

var common = require('../common')
var logger = require('../logger')

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

    if (stats === STATS.BREAK) return objr
    if (stats === STATS.DEFINE) return BREAK

    if (stats === STATS.UNCERTAIN) {
      if (!isFn) objr.__stats = STATS.CERTAIN
      objr.__value = {}
    }

    // stats === STATS.CERTAIN
    var o = objr.__value
    var p = node.property.name

    // NOTE
    //
    // $a is a certain string
    // $a.length()
    // ^^^^^^^^^
    //
    // $a is a certain array
    // $a.size()
    // ^^^^^^^
    //
    // return of both references cannot go further
    // so it is ok when $a is not a object, then BREAK
    if (!utilx.isObject(o)) return BREAK

    if (!o[p]) o[p] = { __stats: STATS.UNCERTAIN }
    if (isFn) {
      o[p].__parent = objr
      o[p].__property = p
    }
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
        callee.__isFunction = true
    var calleer = this[callee.type](callee)
    var stats = calleer.__stats

    var args = node.arguments
    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      this[arg.type](arg)
    }

    if (stats === STATS.BREAK) return calleer
    if (stats === STATS.DEFINE) return BREAK

    // NOTE
    // from .Property, parent.__value must be a object
    var parent = calleer.__parent
    var pIsCertain = parent.__stats === STATS.CERTAIN
    var prop = calleer.__property
    ; delete calleer.__parent
    ; delete calleer.__property

    // NOTE
    // if callee is certain
    // no matter it is a function or not
    // return of the method calling can not go further
    if (stats === STATS.CERTAIN) return BREAK

    //stats === STATS.UNCERTAIN
    calleer.__stats = STATS.CERTAIN
    parent.__stats = STATS.CERTAIN
    var len = args.length
    var arg
    if (len > 0) {
      var arg0 = args[0]
      if (isLiteralString(arg0)) {
        arg = arg0.value
      } else if (arg0.type === 'Integer') {
        arg = 0
      }
    }

    if (prop === 'length' && len === 0) {
      if (pIsCertain) {
        calleer.__value = function() { return '' }
      } else {
        parent.__value = ''
      }

    } else if (prop === 'size' && len === 0) {
      if (pIsCertain) {
        calleer.__value = function() { return '' }
      } else {
        parent.__value = []
      }

    } else if (prop === 'isEmpty' && len === 0) {
      if (pIsCertain) {
        calleer.__value = function() { return '' }
      } else {
        parent.__value = []
      }

    } else if (prop === 'entrySet' && len === 0) {
      delete parent.__value[prop]

    } else if (prop === 'keySet' && len === 0) {
      delete parent.__value[prop]

    } else if (prop === 'get' && len == 1) {
      delete parent.__value[prop]

      if (pIsCertain && utilx.isString(arg)) {
        parent.__value[arg] = parent.__value[arg] || { __stats: STATS.UNCERTAIN }
        return parent.__value[arg]

      } else if (!pIsCertain && utilx.isInteger(arg)) {
        parent.__value = [{ __stats: STATS.UNCERTAIN }]
        return parent.__value[0]
      }

    } else if (prop.indexOf('get') === 0 && prop.length > 3 && len === 0) {
      delete parent.__value[prop]

      var p = extractProp(prop)
      parent.__value[p] = parent.__value[p] || { __stats: STATS.UNCERTAIN }
      return parent.__value[p]

    } else if (prop.indexOf('is') === 0 && prop.length > 2 && len === 0) {
      delete parent.__value[prop]

      var p = extractProp(prop)
      parent.__value[p] = parent.__value[p] || {
        __stats: STATS.CERTAIN,
        __value: false
      }
      return parent.__value[p]

    } else {
      calleer.__value = function() { return '' }
    }

    return BREAK
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
