var utilx = require('utilx')
var STATS = require('./data-stats')

function expand(data) {
  if (utilx.isObject(data)) {
    var rt = {}
    var k
    for (k in data) {
      rt[k] = { __stats: STATS.CERTAIN }
      var v = data[k]
      var goon = utilx.isObject(v) || utilx.isArray(v)
      rt[k].__value = goon ? expand(v) : v
    }
    return rt
  }

  if (utilx.isArray(data)) {
    var rt = []
    data.forEach(function(v) {
      var goon = utilx.isObject(v) || utilx.isArray(v)
      rt.push({
        __stats: STATS.CERTAIN,
        __value: goon ? expand(v) : v
      })
    })
    return rt
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


exports.expand = expand
exports.clean = clean



