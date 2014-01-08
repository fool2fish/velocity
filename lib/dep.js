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
  var lineReg = /.*\r?\n/g;
  var depReg = new RegExp('#{?(' +
    conf.directives.join('|') +
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
      var cRoot = findRoot(cRelPath, conf.roots, true);
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


function findRoot(p, roots, isRelPath) {
  var i;
  for (i = 0; i < roots.length; i++) {
    var root = roots[i];
    if (isRelPath ?
          fs.existsSync(path.join(root, p))
          :
          p.indexOf(root) === 0
       ) {
      return root;
    }
  }
  logger.info('Cannot find root for path<', p, '>');
  return roots[0];
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


function search(p /*private params*/, root) {
  root = root || p;
  if (fs.existsSync(p)) {
    if (fs.statSync(p).isFile() && path.extname(p) === '.vm') {
      var relPath = path.relative(root, p);
      addItem(p, root, relPath);
    } else if(fs.statSync(p).isDirectory()) {
      fs.readdirSync(p).forEach(function(child) {
        search(path.join(p, child), root);
      })
    }
  } else {
    logger.warn('Path<', p, '> not exists.')
  }
}


function clean(fullPath, recursive) {
  if (!fullPath) return;

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
  queue = {};
  data = {};

  var fullPath = conf.file;
  var root = findRoot(fullPath, conf.roots);
  var relPath = path.relative(root, fullPath);

  // reversed dependencies
  if (conf.reverse) {
    conf.roots.forEach(function(root) {
      search(root);
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

