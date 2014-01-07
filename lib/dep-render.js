var fs = require('fs');
var path = require('path');
var os = require('os');
var util = require('util');


function report(fullPath, files, /*private params*/ indent, pFullPath, positions) {
  //fullpath = path.resolve(fullPath);
  var obj = files[fullPath];

  indent = indent || 0;

  console.log(
    space(indent) +
    (obj.notExists ? '!!' : '') +
    obj.relPath +
    // (pFullPath ? ' [' +obj.parents[pFullPath] + ']' : '') +
    (positions ? position(positions) : '')
  );

  var cFullPath;
  for (cFullPath in obj.children) {
    report(cFullPath, files, indent + 2, fullPath, obj.children[cFullPath]);
  }

}

function position(data) {
  var str = ' (';
  str += data.map(function(item ,idx, list) {
    return 'line:' + item[0] + ',col:' + item[1]
  }).join('; ');
  str += ')';
  return str;
}

function space(number) {
  return new Array(number + 1).join(' ');
}


module.exports = report;
