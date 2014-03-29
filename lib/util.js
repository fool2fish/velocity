var fs = require('fs')
var path = require('path')

var logger = require('./logger')

/**
 * mix properties from src to target
 * multiple src be allowed
 * e.g. var target = mix(target, src1, src2, src3)
 */
exports.mix = function(target, src, overwrite) {
    target = target || {}
   /*
    * NOTE
    *
    * can't modify overwrite directly!!!
    *
    * if you assign a new value to overwrite
    * when method in the same file call mix()
    * arguments is not modified
    * but if one method out of this file call it
    * arguments will be modified
    */
    var ow
    var len = arguments.length
    var srcEnd = len - 1
    var lastArg = arguments[len - 1]

    if ( typeof lastArg === 'boolean' || typeof lastArg === 'number') {
        ow = lastArg
        srcEnd--
    } else {
        ow = false
    }

    for (var i = 1; i <= srcEnd; i++) {
        var current = arguments[i] || {}
        for (var j in current) {
            if (ow || typeof target[j] === 'undefined') {
                target[j] = current[j]
            }
        }
    }

    return target
}

exports.getHome =  function() {
  return process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME
}

exports.readConfFile = function(p) {
  try {
    return JSON.parse(fs.readFileSync(p))
  } catch(e) {
      logger.debug('Fail to read config file <%s>.', p)
    return {}
  }
}

exports.isInteger = function(v) {
  if (typeof v !== 'number') return false
  if (Math.floor(v) !== Math.ceil(v)) return false
  return true
}

function isExistedFile(p){
  return p && fs.existsSync(p) && fs.statSync(p).isFile()
}
exports.isExistedFile = isExistedFile

exports.isExistedDir = function(p){
  return p && fs.existsSync(p) && fs.statSync(p).isDirectory()
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
    if (isExistedFile(fullPath)) {
      return fullPath
    }
  }
}

exports.getRoot = function(relPath, roots) {
  for (var i = 0; i < roots.length; i++) {
    var root = roots[i]
    if (isExistedFile(path.join(root, relPath))) {
      return root
    }
  }
}




