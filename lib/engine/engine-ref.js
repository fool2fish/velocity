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
    return node.name
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
  var objv = this[obj.type](obj)

  var prop = node.property
  var propv = this[prop.type](prop)

  var literal
  if (prop.type === 'Prop') {
    literal =  objv.literal + '.' + propv
  } else {
    literal =  objv.literal + '[' + quotes(propv) + ']'
  }

  if (!validateProp(propv)) logger.error('Property <%s> must be integer or string.', literal)

  var rt = {
    literal: literal
  }
  if (isLeft) {
    if (validateObj(objv)) {
      rt.object = objv.value
      rt.property = propv
    } else {
      logger.error('Illegal left hand of assignment expression <%s>.', literal)
    }
  } else {
    rt.success = false
    if (validateObj(objv)) {
      var v = objv.value[propv]
      if (v !== undefined) {
        rt.value = v
        rt.success = true
      }
    }
  }

  return rt
}

function validateObj(objv) {
  if (objv.success) {
    var v = objv.value
    if (!v) return false
    if (typeof v === 'boolean') return false
    if (typeof v === 'number') return false
    if (typeof v === 'string') return false
  } else {
    return false
  }
  return true
}

function validateProp(propv) {
  if (util.isInteger(propv) && propv >=0) return true
  if (typeof propv === 'string' && propv) return true
  return false
}


// 'string' -> "'string'"
// other    -> other
// ['string', 1, false] -> ["'string'", 1, false]
function quotes(input) {
  if (!input) return input
  if (input.length && input.map) {
    return input.map(function(item) {
      return singleQuotes(item)
    })
  } else {
    return singleQuotes(input)
  }
}

function singleQuotes(input) {
  if (typeof input === 'string') {
    return "'" + input + "'"
  } else {
    return input
  }
}