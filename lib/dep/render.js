var colorful = require('colorful')


function render(data, cfg/*private params*/, fullPath , depth, upFullPath) {
  fullPath = fullPath || cfg.template.fullPath
  depth = depth || 0

  var item = data[fullPath]

  console.log(indent(depth) + wrapPath(item))

  var reverse = cfg.reverse
  var morePaths = reverse ? item.parents : item.children
  var keys = Object.keys(morePaths)
  keys.forEach(function(downFullPath, idx) {
    render(data, cfg, downFullPath , depth + 1, fullPath)
  })
}


function indent(depth) {
  return new Array(2 * depth + 1).join(' ')
}


function wrapPath(item) {
  var status = item.status
  var relPath = item.relPath
  if (status === 0) {
    return relPath
  } else if (status === 1) {
    return colorful.red(relPath)
  } else {
    return colorful.yellow(relPath)
  }
}


module.exports = render
