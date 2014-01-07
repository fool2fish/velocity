var fs = require('fs');
var path = require('path');
var os = require('os');
var util = require('util');

var logger = require('./logger');

var data = {/*
  fullPath: {
    root: 'root',
    relPath: 'path relative to root',
    notExists: true,
    parents: {fullPath: directive, ...},
    children: {fullPath: [[line, col], ...], ...}
  },
  ...
*/}


function tree(root, relPath, conf, /*private params*/ pFullPath, pDirective) {
  /*
   * NOTE
   * because of following recursive operation
   * the two regular expressions must be local variable
   * or erroneous globalReg.lastIndex may cause wired problems
   */
  var lineReg = /.*\r?\n/g;
  var quoteReg = new RegExp('#{?(' +
    Object.keys(conf.directives).join('|') +
    ')}?\\(\\s*([\'\"])([^\\)]+)\\2\\)', 'g');

  var fullPath = path.join(root, relPath);
  var recursive = conf.recursive;

  if (!data[fullPath]) {
    data[fullPath] = {
      root: root,
      relPath: relPath,
      parents: {},
      children: {}
    }

    if (fs.existsSync(fullPath)) {
      if ((recursive || !pFullPath) && path.extname(fullPath) === '.vm') {
        var content = fs.readFileSync(fullPath, {
              encoding: conf.encoding
            }).toString();
        var line;
        var lineno = 0;
        while ((line = lineReg.exec(content)) != null) {
          lineno++;
          var matched;
          while ((matched = quoteReg.exec(line[0])) != null) {
            var directive = matched[1];
            var cRelPath = matched[3];
            var cRoot = conf.directives[directive];
            if (typeof cRoot === 'function') {
              cRoot = cRoot(cRelPath);
            }
            var cFullPath = path.join(cRoot, cRelPath);

            var children = data[fullPath].children;
            if (!children[cFullPath]) {
              children[cFullPath] = [];
            }
            children[cFullPath].push([lineno, matched.index]);
            tree(cRoot, cRelPath, conf, fullPath, directive);
          }
        }
      }

    } else {
      data[fullPath].notExists = true;
    }
  }

  if (pFullPath) {
    data[fullPath].parents[pFullPath] = pDirective;
  }

}


module.exports = function (conf) {
  var cwd = process.cwd();
  tree(cwd, path.relative(cwd, conf.file), conf);
  return data;
}

