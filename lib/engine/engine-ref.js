var util = require('../util')
var logger = require('../logger')

var STATS = require('./engine-stats')

// NOTE
// reference and expression won't contain BREAK and STOP
// the only exception is DString
// any BREAK or STOP will be convert to FAIL by DString
// so, we only consider SUCCESS and FAIL except in Statements, Foreach and DString

module.exports = {

  Reference: function(node, isLeft) {
    var obj = node.object
    var objr = this[obj.type](obj, isLeft)

    if (isLeft) {
      // TODO

    } else {
      if (objr.stats === STATS.FAIL) return objr

      // objr.stats === STATS.SUCCESS
      var v = objr.value
      if (v && v.__type === 'Define') {
        if (v.__node) { return this[v.__node.type](v.__node) }
        else { return this.initSuccessInfo() }

      } else if (v === undefined) {
        if (node.silent) {
          return this.initSuccessInfo()
        } else {
          return {
            stats: STATS.SUCCESS,
            value: util.extractContent(this.template.lines, node.pos)
          }
        }

      } else {
        return objr
      }
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

    if (calleer.stats === STATS.FAIL) return caller

    // calleer.stats === STATS.SUCCESS
    if (typeof calleer.value !== 'function') {
      return this.initFailInfo(typeof calleer.value + ' is not a function.', callee.pos)
    }

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

    try {
      var v = calleer.value.apply(null, argsv)
      // NOTE
      // if a function calling don't return a value
      // return an empty string no matter if it is silent
      // to make sure the set method works
      return {
        stats: STATS.SUCCESS,
        value: v === undefined ? '' : v
      }
    } catch (e) {
      return this.initFailInfo('Function calling error:' + e.message, node.pos)
    }
  }
}


function PropIdx(node, isLeft) {
  var obj = node.object
  var objr = this[obj.type](obj)

  if (objr.stats === STATS.FAIL) return objr

  // objr.stats === STATS.SUCCESS
  var prop = node.property
  var propr = this[prop.type](prop)

  if (propr.stats === STATS.FAIL) return propr

  // propr.stats === STATS.SUCCESS
  if (isLeft) {
    // TODO

  } else {
    if (!validateObj(objr.value)) {
      return this.initFailInfo('Cannot read property or index from ' + typeof objr.value + '.', obj.pos)
    }

    if (!validateProp(propr.value)) {
      var msg
      if (prop.type === 'Prop') {
        msg = 'Property must be a string.'
      } else {
        msg = 'Index must be a string or integer.'
      }
      return this.initFailInfo(msg, prop.pos)
    }

    return {
      stats: STATS.SUCCESS,
      value: objr.value[propr.value]
    }
  }
}

function validateObj(v) {
  if (!v) return false
  if (typeof v === 'boolean') return false
  if (typeof v === 'number') return false
  if (typeof v === 'string') return false
  return true
}

function validateProp(v) {
  if (util.isInteger(v) && v >=0) return true
  if (typeof v === 'string' && v) return true
  return false
}


