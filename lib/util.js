var fs = require('fs')
var path = require('path')
var common = require('totoro-common')
var iconv = require('iconv-lite')

var logger = require('./logger')

exports.readFile = function(p, encoding) {
  var buf = fs.readFileSync(p)
  return iconv.decode(buf, encoding)
}

exports.isExistedDir = function(p){
  return p && fs.existsSync(p) && fs.statSync(p).isDirectory()
}

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
    if (common.isExistedFile(fullPath)) {
      return fullPath
    }
  }
}

exports.getRoot = function(relPath, root) {
  for (var i = 0; i < root.length; i++) {
    var r = root[i]
    if (common.isExistedFile(path.join(r, relPath))) {
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

function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}
exports.isObject = isType("Object")
exports.isString = isType("String")
exports.isArray = Array.isArray || isType("Array")
exports.isFunction = isType("Function")

exports.isNumber = function(v) {
  return typeof v === 'number'
}

exports.isInteger = function(v) {
  if (typeof v !== 'number') return false
  if (Math.floor(v) !== Math.ceil(v)) return false
  return true
}









