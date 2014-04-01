var colorful = require('colorful')


function render(data, cfg/*private params*/, fullPath , indent, upFullPath) {
  fullPath = fullPath || cfg.template.fullPath
  indent = indent || '1'

  var item = data[fullPath]

  console.log(wrapIndent(indent) + wrapPath(item))

  var reverse = cfg.reverse
  var morePaths = reverse ? item.parents : item.children
  Object.keys(morePaths).forEach(function(downFullPath, idx, keys) {
    render(data, cfg, downFullPath , indent + (idx === keys.length ? '1' : '0'), fullPath)
  })
}

/*
 * indent = (0|1)+
 * 0: not the last child
 * 1: last child
 * the right most digit matches the node itself
 * the second right most digit matches the node's parent
 * and so on
 *
 * |-root          1
 *   |-c11         10
 *   | |-c111      100
 *   | | |-c1111   1000
 *   | | |-c1112   1001
 *   | |-c112      101
 *   |-c12         11
 */
function wrapIndent(indent) {
  var str = ''
  for (var i = 0; i < indent.length - 1; i++) {
    str += (indent[i] === '0' ? '| ' : '  ')
  }
  return colorful.gray(str + '|-')
}


function wrapPath(item) {
  var stat = item.stat
  var relPath = item.relPath || item.fullPath
  if (stat === 0) {
    return relPath
  } else if (stat === 1) {
    return colorful.red(relPath)
  } else {
    return colorful.yellow(relPath)
  }
}


module.exports = render
