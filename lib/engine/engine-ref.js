var util = require('../util')
var logger = require('../logger')

var eutil = require('./engine-util')
var STATS = require('./engine-stats')


module.exports = {

  Reference: function(node, isLeft) {
    var result = eutil.initResult()
    var obj = node.object
    var objr = this[obj.type](obj, isLeft)

    if (isLeft) {
      // TODO
    } else {
      if (objr.stats === STATS.SUCCESS) {
        var v = objr.value
        if (v && v.__type === 'Define') {
          if (v.__node) {
            var r = this[v.__node.type](v.__node)
            result = eutil.mergeResult(result, r)
          } else {
            // do nothing
          }
          var n = v.__node
          return n ? this[n.type](n) : ''
        } else if (v === undefined){
          if (node.silent) {
            // do nothing
          } else {
            result.value = eutil.getLiteral(this.template.lines, node.pos)
          }
        } else {
          result = eutil.mergeResult(result, objr)
        }
      } else {
        result = eutil.mergeResult(result, objr)
      }
    }

    return result
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
    var that = this
    var callee = node.callee
    var calleev = this[callee.type](callee)

    if (isLeft) {
      logger.error('Method <%s()> cannot be left hand of assignment expression.', calleev.literal)

    } else {
      var args = node.arguments
      var argsv = []
      args.forEach(function(arg) {
        argsv.push(that[arg.type](arg))
      })

      var rt = {
        literal: calleev.literal + '(' + quotes(argsv).join(', ') + ')',
        success: false
      }
      if (calleev.success && typeof calleev.value === 'function') {
        var v = calleev.value.apply(null, argsv)
        rt.value = v === undefined ? '' : v
        rt.success = true
      }
      return rt
    }
  }
}


function PropIdx(node, isLeft) {
  var obj = node.object
  var objr = this[obj.type](obj)

  if (objr.stats !== STATS.SUCCESS) {
    return objr

  } else {
    var prop = node.property
    var propr = this[prop.type](prop)

    if (propr.stats !== STATS.SUCCESS) {
      return propr

    } else {
      if (isLeft) {
        // TODO

      } else {
        if (!validateObj(objr.value)) {
          return {
            stats: STATS.FAIL,
            message: 'Cannot read property or index from invalid object.',
            template: this.template,
            pos: node.pos
          }
        } else if (!validateProp(propr.value)) {
          return {
            stats: STATS.FAIL,
            message: 'Invalid property or index.',
            template: this.template,
            pos: node.pos
          }
        } else {
          return {
            stats: STATS.SUCCESS,
            value: objr.value[propr.value]
          }
        }
      }
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


