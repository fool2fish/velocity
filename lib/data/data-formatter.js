var utilx = require('utilx')
var inspect = require('util').inspect
var STATS = require('./data-stats')
var logger = require('../logger')


function expand(data) {
  var rt

  if (utilx.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      if (/__[a-zA-Z0-9-_]+Return/.test(k)) return
      innerExpand(data, k, rt)
    })
    return rt
  }

  if (utilx.isArray(data)) {
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

  if (utilx.isFunction(v)) {
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
    var goon = utilx.isObject(v) || utilx.isArray(v)
    n = {
      __stats: STATS.CERTAIN,
      __value: goon ? expand(v) : v
    }
  }

  to[k2 || k] = n
}


function clean(data) {
  var rt
  if (utilx.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      var n = data[k]

      if ((n.__stats === STATS.LEFT || n.__stats === STATS.DEFINE) && n.__origin)
        n = n.__origin

      innerClean(data, k, rt)
    })
    return rt
  }

  if (utilx.isArray(data)) {
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
    if (utilx.isObject(v) || utilx.isArray(v)) {
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

  if (utilx.isObject(data)) {
    var keys = Object.keys(data)
    var len = keys.length

    var rt = '{'
    keys.forEach(function(key, idx) {
      var item = data[key]
      rt += br + key + ': ' + tostr(item, indent + 2)
      if (idx < len - 1) rt += ','
    })
    rt += oldBr + '}'
    return rt
  }

  if (utilx.isArray(data)) {
    var len = data.length
    var rt = '['
    data.forEach(function(item, idx) {
      rt += br + tostr(item, indent + 2)
      if (idx < len - 1) rt += ','
    })
    rt += oldBr + ']'
    return rt
  }

  if (utilx.isFunction(data)) {
    return data.toString()
  }

  if (utilx.isString(data)) {
    return inspect(data)
  }

  return data
}


// generate intermedate template to dump the context
function dump(data/* private params*/, literal, indent) {
  indent = indent || 2
  var oldBr = '\n' + utilx.generateLine(indent - 2, ' ')
  var br = oldBr + '  '

  if (utilx.isObject(data)) {
    var keys = Object.keys(data)
    var len = keys.length

    var rt = '{'
    keys.forEach(function(key, idx) {
      var item = data[key]
      var itemLiteral = literal ? literal + '.' + key : '$' + key

      rt += br + key + ': ' + dump(item, itemLiteral, indent + 2)
      if (idx < len - 1) rt += ','
    })
    rt += oldBr + '}'
    return rt
  }

  if (utilx.isArray(data)) {
    // NOTE
    // if the itemLiteral is always the same
    // $list1.list2 will cause an error
    var itemLiteral = '$item' + indent

    var rt = '['
    rt += '#foreach(' + itemLiteral + ' in ' + literal + ')' +
          br + dump(data[0], itemLiteral, indent + 2) +
          '#if($foreach.hasNext),#end' +
          '#end'
    rt += oldBr + ']'
    return rt
  }

  if (utilx.isFunction(data)) {
    return data.toString()
  }

  if (utilx.isString(data)) {
    if (data === '') {
      return '\'' + literal + '\''
    } else {
      return inspect(data)
    }
  }

  return data
}


exports.expand = expand
exports.clean = clean
exports.tostr = tostr
exports.dump = dump

