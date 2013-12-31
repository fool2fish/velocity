var fs = require('fs');
var path = require('path');
var os = require('os');
var util = require('util');


var cwd = process.cwd();
var defCfg = {
  recursive: true,
  directives: {
    include: cwd,
    parse: cwd,
    cmsparse: '/Users/fool2fish/Projects/alipay/cms'
  }
}

var files = {/*
  fullPath: {
    root: 'root',
    relPath: 'path relative to root',
    notExists: true,
    parents: {fullPath: directive, ...},
    children: {fullPath: [[line, col]], ...}
  },
  ...
*/}


function tree(root, relPath, cfg, /*private params*/ pFullPath, pDirective) {
  /*
   * NOTE
   * because of following recursive operation
   * the two regular expressions must be local variable
   * or erroneous globalReg.lastIndex may cause wired problems
   */
  var lineReg = /.*\r?\n/g;
  var quoteReg = new RegExp('#{?(' +
    Object.keys(cfg.directives).join('|') +
    ')}?\\(\\s*([\'\"])([^\\)]+)\\2\\)', 'g');

  var fullPath = path.join(root, relPath);
  var recursive = cfg.recursive;

  if (!files[fullPath]) {
    files[fullPath] = {
      root: root,
      relPath: relPath,
      parents: {},
      children: {}
    }

    if (fs.existsSync(fullPath)) {
      if ((recursive || !pFullPath) && path.extname(fullPath) === '.vm') {
        var content = fs.readFileSync(fullPath, {
              encoding: cfg.encoding
            }).toString();
        var line;
        var lineno = 0;
        while ((line = lineReg.exec(content)) != null) {
          lineno++;
          var matched;
          while ((matched = quoteReg.exec(line[0])) != null) {
            var directive = matched[1];
            var cRoot = cfg.directives[directive];
            var cRelPath = matched[3];
            var cFullPath = path.join(cRoot, cRelPath);

            var children = files[fullPath].children;
            if (!children[cFullPath]) {
              children[cFullPath] = [];
            }
            children[cFullPath].push([lineno, matched.index]);

            tree(cRoot, cRelPath, cfg, fullPath, directive);
          }
        }
      }

    } else {
      files[fullPath].notExists = true;
    }
  }

  if (pFullPath) {
    files[fullPath].parents[pFullPath] = pDirective;
  }

}


function report(fullPath, files, /*private params*/ indent, pFullPath, positions) {
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


module.exports = function (file, cfg) {
  file = path.resolve(file);

  cfg = defCfg;

  tree(cwd, path.relative(cwd, file), cfg);
  report(file, files);
}

