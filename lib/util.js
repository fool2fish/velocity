var fs = require('fs')
var path = require('path')
var common = require('totoro-common')

var logger = require('./logger')


exports.isExistedDir = function(p){
  return p && fs.existsSync(p) && fs.statSync(p).isDirectory()
}

exports.isInteger = function(v) {
  if (typeof v !== 'number') return false
  if (Math.floor(v) !== Math.ceil(v)) return false
  return true
}

// path relative to template root
exports.getRelPath = function(p, roots) {
  var fullPath = path.resolve(p)
  for (var i = 0; i < roots.length; i++) {
    var root = roots[i]
    if (fullPath.indexOf(root) === 0) {
      return path.relative(root, fullPath)
    }
  }
}

exports.getFullPath = function(relPath, roots) {
  for (var i = 0; i < roots.length; i++) {
    var root = roots[i]
    var fullPath = path.join(root, relPath)
    if (common.isExistedFile(fullPath)) {
      return fullPath
    }
  }
}

exports.getRoot = function(relPath, roots) {
  for (var i = 0; i < roots.length; i++) {
    var root = roots[i]
    if (common.isExistedFile(path.join(root, relPath))) {
      return root
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




