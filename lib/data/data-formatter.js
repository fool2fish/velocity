var utilx = require('utilx')
var inspect = require('util').inspect
var STATS = require('./data-stats')
var logger = require('../logger')
var _ = require('lodash')


// expand raw data to intermediate format
function expand(data) {
  var rt

  if (_.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      // ignore return value derived from template
      if (isRtVal(data, k)) return
      innerExpand(data, k, rt)
    })
    return rt
  }

  if (_.isArray(data)) {
    rt = []
    data.forEach(function(v, k) {
      innerExpand(data, k, rt)
    })
    return rt
  }
}

function innerExpand(from, k, to/*private params*/, k2) {
  var v = from[k]
  var n

  if (_.isFunction(v)) {
    n = { __stats: STATS.CERTAIN_FUNC }
    var rtKey = '__' + k + 'Return'

    // derived from template
    if (rtKey in from) {
      n.__argc = v.length
      innerExpand(from, rtKey, n, '__return')

    // defined by user
    } else {
      n.__value = v
    }

  } else {
    var goon = _.isObject(v) || _.isArray(v)
    n = {
      __stats: STATS.CERTAIN,
      __value: goon ? expand(v) : v
    }
  }

  to[k2 || k] = n
}


// restore intermediate data to normal format
function clean(data) {
  var rt
  if (_.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      var n = data[k]
      var stats = n.__stats
      if (stats === STATS.LEFT || stats === STATS.DEFINE) {
        if (n.__origin) {
          data[k] = n.__origin
        } else {
          return
        }
      }
      innerClean(data, k, rt)
    })
    return rt
  }

  if (_.isArray(data)) {
    rt = []
    data.forEach(function(n, k) {
      innerClean(data, k, rt)
    })
    return rt
  }
}

var argsStr = 'a, b, c, d, e, f'

function innerClean(from, k, to/*private params*/, k2) {
  var n = from[k]
  var stats = n.__stats
  var v = n.__value

  if (stats === STATS.CERTAIN) {
    if (_.isObject(v) || _.isArray(v)) {
      v = clean(v)
    }

  } else if (stats === STATS.CERTAIN_FUNC) {
    if ('__return' in n) {
      var argc = n.__argc
      var rtKey = '__' + k + 'Return'
      v = eval('(function(' + argsStr.substr(0, 3 * argc - 2) + '){ return this.' + rtKey + ' })')

      // let key precede rtKey
      to[k2 || k] = v
      innerClean(n, '__return', to, rtKey)
      return
    }

  } else if (stats === STATS.UNCERTAIN) {
    v = v || ''
  }

  to[k2 || k] = v
}


function tostr(data /* private params*/, indent) {
  indent = indent || 2
  var oldBr = '\n' + utilx.generateLine(indent - 2, ' ')
  var br = oldBr + '  '

  if (_.isObject(data)) {
    var keys = Object.keys(data)
    var len = keys.length

    var rt = '{'
    keys.forEach(function(key, idx) {
      var item = data[key]
      var keyLiteral = key.indexOf('-') === -1 ? key : "'" + key + "'"
      rt += br + keyLiteral + ': ' + tostr(item, indent + 2)
      if (idx < len - 1) rt += ','
    })
    rt += oldBr + '}'
    return rt
  }

  if (_.isArray(data)) {
    var len = data.length
    var rt = '['
    data.forEach(function(item, idx) {
      rt += br + tostr(item, indent + 2)
      if (idx < len - 1) rt += ','
    })
    rt += oldBr + ']'
    return rt
  }

  if (_.isFunction(data)) {
    return data.toString()
  }

  if (_.isString(data)) {
    return inspect(data)
  }

  return data
}


// generate intermedate template to dump the context
function dump(data/* private params*/, literal, indent) {
  indent = indent || 2
  var oldBr = '\n' + utilx.generateLine(indent - 2, ' ')
  var br = oldBr + '  '

  var isTop = literal ? false : true

  var rt = ''
  var head = isTop ? '' : '#if(' + literal + ')'
  var tail = isTop ? '' : '#{else}undefined#end'

  if (_.isObject(data)) {
    var keys = Object.keys(data)
    var len = keys.length

    rt = head + '{'
    keys.forEach(function(key, idx) {
      var item = data[key]
      var itemLiteral
      var keyLiteral = key.indexOf('-') === -1 ? key : "'" + key + "'"

      var funcName = isRtVal(data, key)
      if (funcName) {
        // won't dump for the return value of a method with params
        if (data[funcName].length) {
          rt += br + keyLiteral + ': ' + tostr(item, indent + 2)

        } else {
          itemLiteral = literal + '.' + funcName + '()'
          rt += br + keyLiteral + ': ' + dump(item, itemLiteral, indent + 2)
        }

      } else {
        itemLiteral = literal ? literal + '.' + key : '$!' + key
        rt += br + keyLiteral + ': ' + dump(item, itemLiteral, indent + 2)
      }

      if (idx < len - 1) rt += ','
    })

    rt += oldBr + '}' + tail
    return rt
  }

  if (_.isArray(data)) {
    // NOTE
    // if the itemLiteral is always the same
    // $list1.list2 will cause an error
    var itemLiteral = '$!item' + indent

    rt = head + '['
    rt += '#foreach(' + itemLiteral + ' in ' + literal + ')' +
          '#if($velocityCount > 1),#end' + br + dump(data[0], itemLiteral, indent + 2) +
          '#end'
    rt += oldBr + ']' + tail
    return rt
  }

  if (_.isFunction(data)) {
    return data.toString()
  }

  if (_.isString(data)) {
    if (data === '') {
      return '\'' + literal + '\''
    } else {
      return inspect(data)
    }
  }

  return literal
}


/*
 * data = {
 *   method0: function() { ... },
 *   method1: function(){ ... },
 *   __method1Return: { ... },
 *   __method2Return: { ... }
 * }
 *
 * isRtVal(data, 'method0') => undefined
 * isRtVal(data, '__method1Return') => 'method1'
 * isRtVal(data, '__method2Return') => undefined
 */

var rtReg = /^__([a-zA-Z0-9-_]+)Return$/
function isRtVal(data, key) {
  var match = rtReg.exec(key)
  if (!match) return
  var name = match[1]
  if (name in data) return name
  return
}


exports.expand = expand
exports.clean = clean
exports.tostr = tostr
exports.dump = dump
