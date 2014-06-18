var utilx = require('utilx')
var inspect = require('util').inspect
var STATS = require('./data-stats')
var logger = require('../logger')


function expand(data) {
  var rt

  if (utilx.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      innerExpand(rt, k, data[k])
    })
    return rt
  }

  if (utilx.isArray(data)) {
    rt = []
    data.forEach(function(v, k) {
      innerExpand(rt, k, v)
    })
    return rt
  }
}

function innerExpand(rt, k, v) {
  var stats = utilx.isFunction(v) ? STATS.CERTAIN_FUNC : STATS.CERTAIN
  var goon = utilx.isObject(v) || utilx.isArray(v)
  var obj = {
    __stats: stats,
    __value: goon ? expand(v) : v
  }

  rt[k] = obj
}


function clean(data) {
  var rt
  if (utilx.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      var n = data[k]

      if ((n.__stats === STATS.LEFT || n.__stats === STATS.DEFINE) && n.__origin)
        n = n.__origin

      innerClean(rt, k, n)
    })
    return rt
  }

  if (utilx.isArray(data)) {
    rt = []
    data.forEach(function(n, k) {
      innerClean(rt, k, n)
    })
    return rt
  }
}

var argsStr = 'a, b, c, d, e, f'

function innerClean(rt, k, n) {
  var stats = n.__stats
  var v = n.__value

  if (stats === STATS.CERTAIN) {
    if (utilx.isObject(v) || utilx.isArray(v)) {
      rt[k] = clean(v)
    } else {
      rt[k] = v
    }

  } else if (stats === STATS.CERTAIN_FUNC) {
    if (n.__value) {
      rt[k] = n.__value
    } else {
      var argc = n.__argc
      rt[k] = eval('(function(' + argsStr.substr(0, 3 * argc - 2) + '){ return this.__' + k + ' })')
      innerClean(rt, '__' + k, n.__return)
    }

  } else if (stats === STATS.UNCERTAIN) {
    rt[k] = v || ''
  }
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

