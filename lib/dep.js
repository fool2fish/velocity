var fs = require('fs');
var path = require('path');

var logger = require('./logger');

// files waiting for scan
var queue = {/*fullPath: true, ...*/};

// info of template files, include queuing files
var data = {/*
  fullPath: {
    root: 'vm root',
    relPath: 'path relative to root',
    notExists: true,
    parents: {fullPath: directive, ...},
    children: {fullPath: [[line, col], ...], ...}
  },
  ...
*/}


function scan(fullPath, conf) {
  /*
   * NOTE
   * the two regular expression must be local
   * or globalReg.lastIndex may cause wired problems
   */
  var lineReg = /.*\r?\n/g;
  var depReg = new RegExp('#{?(' +
    Object.keys(conf.directives).join('|') +
    ')}?\\(\\s*([\'\"])([^\\)]+)\\2\\)', 'g');

  if (fs.existsSync(fullPath)) {
    if (path.extname(fullPath) === '.vm') {
      var content = fs.readFileSync(fullPath, {
            encoding: conf.encoding
          }).toString();
      var line;
      var lineno = 0;
      while ((line = lineReg.exec(content)) != null) {
        lineno++;
        var matched;
        while ((matched = depReg.exec(line[0])) != null) {
          var directive = matched[1];
          var cRelPath = matched[3];
          var cRoot = conf.directives[directive];
          if (typeof cRoot === 'function') {
            cRoot = cRoot(cRelPath);
          }
          var cFullPath = path.join(cRoot, cRelPath);

          // add child data
          if (!data[cFullPath]) {
            data[cFullPath] = {
              root: cRoot,
              relPath: cRelPath,
              parents: {},
              children: {}
            }
            queue[cFullPath] = true;
          }
          data[cFullPath].parents[fullPath] = directive;

          // update child info
          var children = data[fullPath].children;
          if (!children[cFullPath]) {
            children[cFullPath] = [];
          }
          children[cFullPath].push([lineno, matched.index]);
        }
      }
    }
  } else {
    data[fullPath].notExists = true;
  }

  delete queue[fullPath];
}


function findRoot(fullPath, directives) {
  var i;
  var root;
  for (i in directives) {
    root = directives[i];
    if (typeof root === 'function') {
      root = root(fullPath);
    }
    if (fullPath.indexOf(root) > -1) {
      return root;
    }
  }
}


module.exports = function (conf) {
  queue = {};
  data = {};

  var fullPath = conf.file;
  var root = findRoot(fullPath, conf.directives);
  var relPath = path.relative(root, fullPath);

  data[fullPath] = {
    root: root,
    relPath: relPath,
    parents: {},
    children: {}
  }
  queue[fullPath] = true;

  if (conf.recursive) {
    var key;
    while (Object.keys(queue).length) {
      for (key in queue) {
        scan(key, conf);
      }
    }
  } else {
    scan(fullPath, conf);
  }

  return data;
}

