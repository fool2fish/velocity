var STATS = require('./engine-stats')

exports.initResult = function() {
  return {
    stats: STATS.SUCCESS,
    value: ''
  }
}

exports.mergeResult = function(to, from) {
  to.stats = from.stats
  if (to.stats === STATS.SUCCESS) {
    to.value += from.value
  } else {
    to.message = from.message
    to.template = from.file
    to.pos = from.pos
  }
  return to
}

exports.getLiteral = function(lines, pos) {
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
