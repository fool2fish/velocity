var fs = require('fs')
var path = require('path')
var common = require('totoro-common')

var logger = require('../logger')
var util = require('../util')

// files waiting for scan
var QUEUE = {}

// scanned files
var FILES = {/*
  fullPath: {
    root: 'vm root',
    relPath: 'path relative to root',
    fullPath: 'full path',
    status: 0(normal), 1(notExists), 2(hasVariable),
    parents: {fullPath: true, ...},
    children: {fullPath: true, ...}
  },
  ...
*/}


function scan(fullPath, cfg) {
  if (fullPath in FILES) {
    delete QUEUE[fullPath]
    return
  }

  FILES[fullPath] = QUEUE[fullPath]
  delete QUEUE[fullPath]

  if (path.extname(fullPath) != '.vm') return

  var item = FILES[fullPath]
  if (item.status !== 0) return

  var reg = /##.*$|#\*[\s\S]*?\*#|#\[\[[\s\S]*?\]\]#|#{?(?:include|parse|cmsparse)}?\(\s*([^\)]+?)\s*\)/gm
  var direcReg = /^#{?[a-zA-Z]/
  var content = util.readFile(fullPath, cfg.encoding)

  var matched
  while ((matched = reg.exec(content)) != null) {
    if (direcReg.test(matched[0])) {
      // -____-" #include may has multiple params
      matched[1].split(/\s*,\s*|\s+/).forEach(function(cRelPath) {
        var child = addItem(cRelPath, cfg.roots)
        child.parents[fullPath] = true
        item.children[child.fullPath] = true
      })
    }
  }
}


// add path to QUEUE
function addItem(p, roots) {
  var info = {status: 1, parents:{}, children:{}}

  // directory
  if (util.isExistedDir(p)) {
    fs.readdirSync(p).forEach(function(child) {
      addItem(path.join(p, child), roots)
    })
    return
  }

  // full path
  if (common.isExistedFile(p)) {
    info.fullPath = p
    info.relPath = util.getRelPath(p, roots)
    if (info.relPath) {
      info.root = util.getRoot(info.relPath, roots)
      info.status = 0
    }

  // relative path
  } else {
    p = cleanRelPath(p)
    info.relPath = p
    info.root = util.getRoot(p, roots)

    if (info.root) {
      info.fullPath = path.join(info.root, p)
      info.status = 0
    } else {
      info.fullPath = path.join(roots[0], p)
      info.status = hasVariable(p) ? 2 : 1
    }
  }

  var fullPath = info.fullPath
  if (!QUEUE[fullPath] && !FILES[fullPath]) {
    QUEUE[fullPath] = info
  }

  return QUEUE[fullPath] || FILES[fullPath]
}

// 'path' -> path
// "path" -> path
// $path  -> $path
function cleanRelPath(relPath) {
  if (/'|"/.test(relPath)) {
    return relPath.substring(1, relPath.length - 1)
  } else {
    return relPath
  }
}

// '$path' -> 0
// "path"  -> 0
// "$path" -> 1
// $path   -> 1
// path    -> 0
function hasVariable(relPath) {
   return relPath[0] !== "'" && /\$\!?\{?[a-zA-Z].*\}?/.test(relPath)
}


// remove files not in (reverse) dependency tree
function cleanFiles(fullPath) {
  var data = {}

  function _cleanFiles(fp) {
    data[fp] = FILES[fp]
    Object.keys(FILES[fp].parents).forEach(function(pfp) {
      _cleanFiles(pfp)
    })
  }
  _cleanFiles(fullPath)

  FILES = data
}


module.exports = function (cfg) {
  QUEUE = {}
  FILES = {}

  var template = cfg.template
  if (!template.isFile) logger.error('Template is not a file.')

  var fullPath = template.fullPath
  var roots = cfg.roots

  if (cfg.reverse) {
    roots.forEach(function(root) { addItem(root, roots) })
    Object.keys(QUEUE).forEach(function(p) {
      scan(p, cfg)
    })
    cleanFiles(fullPath)

  } else {
    addItem(fullPath, roots)
    while (Object.keys(QUEUE).length) {
      Object.keys(QUEUE).forEach(function(p) {
        scan(p, cfg)
      })
    }
  }

  logger.debug(FILES)
  return FILES
}

