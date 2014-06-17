var utilx = require('utilx')
var inspect = require('util').inspect
var STATS = require('./data-stats')
var logger = require('../logger')


function expand(data) {
  var rt

  if (utilx.isObject(data)) {
    rt = {}
    Object.keys(data).forEach(function(k) {
      innerExpand(rt, data[k], k)
    })
    return rt
  }

  if (utilx.isArray(data)) {
    rt = []
    data.forEach(function(v) {
      innerExpand(rt, v)
    })
    return rt
  }
}

function innerExpand(rt, v, k) {
  var stats = utilx.isFunction(v) ? STATS.CERTAIN_FUNC : STATS.CERTAIN
  var goon = utilx.isObject(v) || utilx.isArray(v)
  var obj = {
    __stats: stats,
    __value: goon ? expand(v) : v
  }

  if (typeof k === 'undefined') {
    rt.push(obj)
  } else {
    rt[k] = obj
  }
}


function clean(data) {
  if (utilx.isObject(data)) {
    var rt = {}
    var k
    for (k in data) {
      var n = data[k]

      if ((n.__stats === STATS.LEFT || n.__stats === STATS.DEFINE) && n.__origin)
        n = n.__origin

      var stats = n.__stats
      var v = n.__value

      if (stats === STATS.CERTAIN) {
        if (utilx.isObject(v) || utilx.isArray(v)) {
          rt[k] = clean(v)
        } else {
          rt[k] = v
        }
      } else if (stats === STATS.UNCERTAIN) {
        rt[k] = v || ''
      }
    }
    return rt
  }

  if (utilx.isArray(data)) {
    var rt = []
    data.forEach(function(n) {
      // n.__stats === STATS.LEFT is impossible
      var stats = n.__stats
      var v = n.__value
      if (stats === STATS.CERTAIN) {
        if (utilx.isObject(v) || utilx.isArray(v)) {
          rt.push(clean(v))
        } else {
          rt.push(v)
        }
      } else if (stats === STATS.UNCERTAIN) {
        rt.push(v || '')
      }
    })
    return rt
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

