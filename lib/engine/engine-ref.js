var util = require('../util')
var logger = require('../logger')

var STATS = require('./engine-stats')

// NOTE
// reference and expression won't contain BREAK and STOP
// the only exception is DString
// any BREAK or STOP will be convert to FAIL by DString

module.exports = {

  Reference: function(node, isLeft) {
    var obj = node.object
    var objr = this[obj.type](obj, isLeft)

    if (objr.stats === STATS.FAIL) return objr

    if (isLeft) return objr

    var v = objr.value
    if (v && v.__type === 'Define') {
      if (!v.__node) return this.initSuccessInfo()

      this.pushTemplate(v.__template)
      var result = this[v.__node.type](v.__node)
      this.popTemplate()

      if (result.stats !== STATS.SUCCESS) {
        // at where the #define is used
        result.stack.push([this.template, node.pos])
      }
      return result

    } else if (v === undefined) {
      return {
        stats: STATS.SUCCESS,
        value: v,
        silent: node.silent,
        isMethod: obj.type === 'Method',
        literal: util.extractContent(this.template.lines, node.pos)
      }
    } else {
      return objr
    }
  },

  Identifier: function(node, isLeft) {
    var n = node.name

    if (isLeft) {
      return {
        stats: STATS.SUCCESS,
        object: this.topContext,
        property: n
      }

    } else {
      return {
        stats: STATS.SUCCESS,
        value: this.get(n)
      }
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

  Method: function(node, isLeft) {
    if (isLeft) {
      return this.initFailInfo(
        'Method cannot be the left hand of an assignment expression.',
        node.pos
      )
    }

    // !isLeft
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

    if (!util.isFunction(calleer.value)) {
      var o = calleer.object
      var p = calleer.property
      var l = argsv.length

      // string.length() -> string.length
      if (util.isString(o) && p === 'length' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: calleer.value
        }
      }

      // array.size() -> array.length
      if (util.isArray(o) && p === 'size' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: o.length
        }
      }

      // array.isEmpty() -> !array.length
      if (util.isArray(o) && p === 'isEmpty' && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: !o.length
        }
      }

      var isArrOrObj = util.isArray(o) || util.isObject(o)
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
      if (util.isObject(o) && p.indexOf('is') === 0 && p.length > 2 && l === 0) {
        return {
          stats: STATS.SUCCESS,
          value: !!o[extractProp(p)]
        }
      }

      return this.initFailInfo(typeof calleer.value + ' is not a function.', node.pos)
    }

    try {
      var result = calleer.value.apply(null, argsv)
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


function PropIdx(node, isLeft) {
  var obj = node.object
  var objr = this[obj.type](obj)

  if (objr.stats === STATS.FAIL) return objr
  if (objr.value === null || objr.value === undefined) {
    return this.initFailInfo('Cannot read or write property or index of ' + typeof objr.value + '.', obj.pos)
  }

  var prop = node.property
  var propr = this[prop.type](prop)

  if (propr.stats === STATS.FAIL) return propr
  if (!validateProp(propr.value)) {
    var msg
    if (prop.type === 'Prop') {
      msg = 'Property is not a non-empty string.'
    } else {
      msg = 'Index is not a non-empty string or integer.'
    }
    return this.initFailInfo(msg, prop.pos)
  }

  if (isLeft) {
    return {
      stats: STATS.SUCCESS,
      object: objr.value,
      property: propr.value
    }
  } else {
    return {
      stats: STATS.SUCCESS,
      value: objr.value[propr.value],
      object: objr.value,
      property: propr.value
    }
  }
}


function validateProp(v) {
  if (util.isInteger(v) && v >=0) return true
  if (util.isString(v) && v) return true
  return false
}

function extractProp(v) {
  v = v.replace(/^(get|set|is)/, '')
  return v[0].toLowerCase() + v.substr(1)
}


