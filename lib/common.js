var fs = require('fs')
var path = require('path')
var utilx = require('utilx')

var logger = require('./logger')
var TYPE = require('./data/data-type')


// path relative to template root
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









