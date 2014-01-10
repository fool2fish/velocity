var fs = require('fs');
var path = require('path');

var logger = require('./logger');

// files waiting for scan
var queue = {};

// scanned files
var data = {/*
  fullPath: {
    root: 'vm root',
    relPath: 'path relative to root',
    notExists: true,
    variable: [[line, col], ...]
    parents: {fullPath: directive, ...},
    children: {fullPath: [[line, col], ...], ...}
  },
  ...
*/}


function scan(fullPath, conf) {
  data[fullPath] = queue[fullPath];
  delete queue[fullPath];

  if (data[fullPath].notExists || path.extname(fullPath) != '.vm') {
    return;
  }

  var item = data[fullPath];
  var lineReg = /^.*$/gm;
  var depReg = new RegExp('#{?(' +
    conf.directives.join('|') +
    ')}?\\(\\s*([\'\"])([^\\)]+)\\2\\)', 'g');
  if (conf.variable) {
    var variableReg = new RegExp('\\$!?\\{?' + conf.variable + '\\}?(?=[^0-9a-zA-Z-_]|$)', 'g');
  }

  var content = fs.readFileSync(fullPath, {
        encoding: conf.encoding
      }).toString();

  var line;
  var lineno = 0;
  while ((line = lineReg.exec(content)) != null) {
    /*
     * NOTE
     * when lineReg match an empty line, lineReg.lastIndex dose't change
     * we must increase it manually to avoid endless loop
     */
    if (line[0] === '') {
      lineReg.lastIndex++;
    }

    lineno++;
    var matched;

    if (variableReg) {
      while ((matched = variableReg.exec(line[0])) != null) {
        item.variable.push([lineno, matched.index]);
      }
    }

    while ((matched = depReg.exec(line[0])) != null) {
      var directive = matched[1];
      var cRelPath = matched[3];
      var cRoot = findRoot(cRelPath, conf.roots, true);
      var cFullPath = path.join(cRoot, cRelPath);

      var child = addItem(cFullPath, cRoot, cRelPath);
      child.parents[fullPath] = directive;

      if (!item.children[cFullPath]) {
        item.children[cFullPath] = [];
      }
      item.children[cFullPath].push([lineno, matched.index]);
    }
  }
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
  if (!queue[fullPath] && !data[fullPath]) {
    queue[fullPath] = {
      root: root,
      relPath: relPath,
      notExists: !fs.existsSync(fullPath),
      variable: [],
      parents: {},
      children: {}
    }
  }

  return queue[fullPath] || data[fullPath];
}


function search(p, root) {
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
      cleanedData[fullPath] = data[fullPath];
      Object.keys(data[fullPath].parents).forEach(function(pFullPath) {
        recursiveClean(pFullPath);
      })
    }
    recursiveClean(fullPath);

  } else {
    cleanedData[fullPath] = data[fullPath];
    Object.keys(data[fullPath].parents).forEach(function(pFullPath) {
      cleanedData[pFullPath] = data[pFullPath];
    })
  }

  data = cleanedData;
  cleanedData = {};
}


module.exports = function (conf) {
  queue = {};
  data = {};

  if (conf.file) {
    var fullPath = conf.file;
    var root = findRoot(fullPath, conf.roots);
    var relPath = path.relative(root, fullPath);
  }

  if (conf.reverse || !conf.file) {
    if (conf.variable && conf.file && !conf.recursive) {
      addItem(fullPath, root, relPath);
      scan(fullPath, conf);
    } else {
      conf.roots.forEach(function(root) {
        search(root, root);
      });

      Object.keys(queue).forEach(function(fullPath) {
        scan(fullPath, conf);
      })

      clean(conf.file, conf.recursive);
    }

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
      Object.keys(queue).forEach(function(fullPath) {
        scan(fullPath, conf);
      })
    }
  }

  return data;
}

