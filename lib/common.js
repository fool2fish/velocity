var fs = require('fs')
var path = require('path')
var utilx = require('utilx')

var logger = require('./logger')
var STATS = require('./data/data-stats')


exports.getRelPath = function(p, root) {
  var fullPath = path.resolve(p)
  for (var i = 0; i < root.length; i++) {
    var r = root[i]
    if (fullPath.indexOf(r) === 0) {
      return path.relative(r, fullPath)
    }
  }
}

exports.getFullPath = function(relPath, root) {
  for (var i = 0; i < root.length; i++) {
    var r = root[i]
    var fullPath = path.join(r, relPath)
    if (utilx.isExistedFile(fullPath)) {
      return fullPath
    }
  }
}

exports.getRoot = function(relPath, root) {
  for (var i = 0; i < root.length; i++) {
    var r = root[i]
    if (utilx.isExistedFile(path.join(r, relPath))) {
      return r
    }
  }
}

exports.extractContent = function(lines, pos) {
  var fl = pos.first_line
  var ll = pos.last_line
  var fc = pos.first_column
  var lc = pos.last_column

  if (fl === ll) {
    return lines[fl - 1].substring(fc, lc)
  }

  var rt = []
  for (var i = fl; i <= ll; i++) {
    var line = lines[i - 1]
    if (i === fl) {
      line = line.substring(fc)
    } else if (i === ll) {
      line = line.substring(0, lc)
    }
    rt.push(line)
  }
  return rt.join(require('os').EOL)
}


exports.isId = function(node) {
  return node.object.type === 'Identifier'
}

exports.isLiteralString = function(n) {
  if (n.type === 'String') return true
  if (n.type === 'DString' && n.value.search(/\$|#/) === -1) return true
  return false
}

exports.getOrigin = function(n) {
  if (!n) return
  if (n.__origin) return n.__origin
  var stats = n.__stats
  if (stats === STATS.CERTAIN || stats === STATS.UNCERTAIN) return n
}

exports.markError = function(line, pos) {
  if (!line || !pos) return ''

  var rt = line + '\n'
      rt += utilx.generateLine(pos.first_column, ' ')
  var l = (pos.first_line === pos.last_line ? pos.last_column : line.length) - pos.first_column
      rt += utilx.generateLine(l, '^') + '\n'
  return rt
}


exports.getRealLoc = function(loc) {
  var templ = loc[0]
  var pos = loc[1]
  pos = templ.offset || pos
  for (templ; templ; templ = templ.__parent) {
    if (templ.isFile) break
  }
  return [templ, pos]
}

exports.loc2str = function(loc) {
  var templ = loc[0]
  var pos = loc[1]
  var fullPath = templ.isFile ? templ.fullPath : trim(templ.raw)
  return fullPath + ' (' + pos.first_line + ':' + pos.first_column + ')'
}

function trim(str, len) {
  len = len || 40
  str = str.substr(0, len).replace(/\n/g, '\\n')
  if (str.length > 40) str += '...'
  return str
}







