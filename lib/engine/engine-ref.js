var util = require('../util')
var logger = require('../logger')

module.exports = {

  Reference: function(node, isLeft) {
    var obj = node.object
    var objv = this[obj.type](obj, isLeft)

    if (isLeft) {
      return objv
    } else {
      if (objv.success) {
        var v = objv.value
        if (v.__type === 'Define') {
          var n = v.__node
          return n ? this[n.type](n) : ''
        } else {
          return v
        }
      } else if (node.silent){
        return ''
      } else {
        var rt = '$'
        if (node.wrapped) rt += '{'
        rt += objv.literal
        if (node.wrapped) rt += '}'
        return rt
      }
    }
  },

  Identifier: function(node, isLeft) {
    var n = node.name

    if (isLeft) {
      return {
        object: this.topContext,
        property: n,
        literal: n
      }

    } else {
      var v = this.get(n)
      return {
        value: v,
        literal: n,
        success: v !== undefined
      }
    }
  },

  Prop: function(node) {
    return node.name
  },

  Property: function(node, isLeft) {
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
  },

  Index: this.Property,

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
        rt.value = v || ''
        rt.success = true
      }
      return rt
    }
  }
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