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
      var cFullPath = path.join(cRoot, cRelPath);

      addItem(cFullPath, cRoot, cRelPath);
      data[cFullPath].parents[fullPath] = directive;

      var children = data[fullPath].children;
      if (!children[cFullPath]) {
        children[cFullPath] = [];
      }
      children[cFullPath].push([lineno, matched.index]);
    }
  }

  delete queue[fullPath];
}


function addItem(fullPath, root, relPath) {
  if (!data[fullPath]) {
    data[fullPath] = {
      root: root,
      relPath: relPath,
      parents: {},
      children: {}
    }
    if (!fs.existsSync(fullPath)) data[fullPath].notExists = true;

    if (!data[fullPath].notExists && path.extname(fullPath) === '.vm') {
      queue[fullPath] = true;
    }
  }
}


function findRoot(fullPath, directives) {
  var root;
  Object.keys(directives).forEach(function(directive) {
    if (fullPath.indexOf(directives[directive]) > -1) {
      root = directives[directive];
    }
  });
  if (!root) logger.error('Illegal path:', fullPath);
  return root;
}


function search(p, directives) {
  if (fs.existsSync(p)) {
    if (fs.statSync(p).isFile() && path.extname(p) === '.vm') {
      var root = findRoot(p, directives);
      var relPath = path.relative(root, p);
      addItem(p, root, relPath);
    } else if(fs.statSync(p).isDirectory()) {
      fs.readdirSync(p).forEach(function(child) {
        search(path.join(p, child), directives);
      })
    }
  } else {
    logger.warn('Path:', dir, 'not exists.')
  }
}


function clean(fullPath, recursive) {
  var cleanedData = {};

  if (recursive) {
    function recursiveClean(fullPath) {
      var item = data[fullPath];
      cleanedData[fullPath] = item;
      Object.keys(item.parents).forEach(function(pFullPath) {
        recursiveClean(pFullPath);
      })
    }
    recursiveClean(fullPath, recursive);

  } else {
    var item = data[fullPath];
    cleanedData[fullPath] = item;
    Object.keys(item.parents).forEach(function(pFullPath) {
      cleanedData[pFullPath] = data[pFullPath];
      cleanedData[pFullPath].parents = {};
    })
  }

  data = cleanedData;
  cleanedData = {};
}


module.exports = function (conf) {
  if (!fs.existsSync(conf.file)) {
    logger.error('File:', conf.file, 'not exists!');
  }

  queue = {};
  data = {};

  var fullPath = conf.file;
  var root = findRoot(fullPath, conf.directives);
  var relPath = path.relative(root, fullPath);

  // reversed dependencies
  if (conf.reverse) {
    Object.keys(conf.directives).forEach(function(directive) {
      search(conf.directives[directive], conf.directives);
    });

    Object.keys(queue).forEach(function(fullPath) {
      scan(fullPath, conf);
    })

    clean(fullPath, conf.recursive);

  // dependencies
  } else {
    addItem(fullPath, root, relPath);
    if (conf.recursive) {
      while (Object.keys(queue).length) {
        Object.keys(queue).forEach(function(fullPath) {
          scan(fullPath, conf);
        })
      }
    } else {
      scan(fullPath, conf);
    }
  }

  return data;
}

