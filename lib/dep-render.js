var colorful = require('colorful');

function render(data, fullPath, reverse,/*private params*/ indent, upFullPath) {
  indent = indent || 0;
  var item = data[fullPath];

  console.log(
    space(indent) +
    (item.notExists ? colorful.red(item.relPath) : item.relPath) +
    (upFullPath ?
      reverse ?
        position(item.children[upFullPath])
        : position(data[upFullPath].children[fullPath])
      : '')
  );

  var downFullPath;
  var morePaths = reverse ? item.parents : item.children;
  for (downFullPath in morePaths) {
    render(data, downFullPath, reverse, indent + 2, fullPath);
  }
}


function position(positions) {
  var str = ' (line:';
  str += positions.map(function(item ,idx, list) {
    return item[0];
  }).join(',');
  str += ')';
  return colorful.gray(str);
}


function space(amount) {
  return new Array(amount + 1).join(' ');
}


module.exports = function(data, conf) {
  var fullPath = conf.file;
  var reverse = conf.reverse;
  render(data, fullPath, reverse);
};
