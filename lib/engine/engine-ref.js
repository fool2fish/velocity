var util = require('../util')
var logger = require('../logger')

var STATS = require('./engine-stats')


module.exports = {

  Reference: function(node, isLeft) {
    var obj = node.object
    var objr = this[obj.type](obj, isLeft)

    if (isLeft) {
      // TODO

    } else {
      if (objr.stats === STATS.SUCCESS) {
        var v = objr.value
        if (v && v.__type === 'Define') {
          if (v.__node) {
            return this[v.__node.type](v.__node)
          } else {
            return {
              stats: STATS.SUCCESS,
              value: ''
            }
          }

        } else if (v === undefined){
          if (node.silent) {
            return {
              stats: STATS.SUCCESS,
              value: ''
            }
          } else {
            return {
              stats: STATS.SUCCESS,
              value: util.extractContent(this.template.lines, node.pos)
            }
          }

        } else {
          return objr
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
      return {
        stats: STATS.FAIL,
        message: 'Method cannot be the left hand of assignment expression.',
        template: this.template,
        pos: node.pos
      }

    } else {
      var callee = node.callee
      var calleer = this[callee.type](callee)

      if (calleer.stats !== STATS.SUCCESS) {
        return calleer

      } else if (typeof calleer.value !== 'function') {
        return {
          stats: STATS.FAIL,
          message: typeof calleer.value + ' is not a function.',
          template: this.template,
          pos: node.pos
        }

      } else {
        var args = node.arguments
        var argsv = []

        for (var i = 0; i < args.length; i++) {
          var arg = args[i]
          var argr = this[arg.type](arg)
          if (argr.stats !== STATS.SUCCESS) {
            return argr
          } else {
            argsv.push(argr.value)
          }
        }

        try {
          var v = calleer.value.apply(null, argsv)
        } catch (e) {
          return {
            stats: STATS.FAIL,
            message: 'Function calling error:' + e.message,
            template: this.tempate,
            pos: node.pos
          }
        }

        return {
          stats: STATS.SUCCESS,
          value: v === undefined ? '' : v
        }
      }
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
            message: 'Cannot read property or index from ' + typeof objr.value + '.',
            template: this.template,
            pos: obj.pos
          }
        } else if (!validateProp(propr.value)) {
          var msg
          if (prop.type === 'Prop') {
            msg = 'Property must be a string.'
          } else {
            msg = 'Index must be a string or integer.'
          }
          return {
            stats: STATS.FAIL,
            message: msg,
            template: this.template,
            pos: prop.pos
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


