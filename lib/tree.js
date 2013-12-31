var fs = require('fs');
var path = require('path');
var os = require('os');


var lineReg = /.*\r?\n/g;
var quoteReg;

var cwd = process.cwd();
var defCfg = {
  recursive: false,
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
    parents: {fullPath: true, ...},
    children: {fullPath: {directive: directive, positions: [[line, col]]}, ...}
  },
  ...
*/}


function tree(root, relPath, cfg, pFullPath) {
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
        var line, lineno = 0;

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
              children[cFullPath] = {
                directive: directive,
                positions: []
              };
            }
            children[cFullPath].positions.push([lineno, matched.index]);

            tree(cRoot, cRelPath, cfg, fullPath);
          }
        }
      }

    } else {
      files[fullPath].notExists = true;
    }
  }

  if (pFullPath) {
    files[fullPath].parents[pFullPath] = true;
  }

}


function report(fullPath, files, indent) {
  var obj = files[fullPath];
  if (!obj) return;

  if (!indent) {
    console.log(obj.relPath);
    indent = indent || 0;
  }

  var cFullPath;
  for (cFullPath in obj.children) {
    var child = obj.children[cFullPath];
    console.log(space(indent + 2) + child.directive + ': ' + child.relPath + ' ' +  position(child.positions));
    report(cFullPath, files, indent + 4);
  }

  console.log();
}

function position(data) {
  var str = '(';
  str += data.map(function(item ,idx, list) {
    return 'line:' + item[0] + ' col:' + item[1] + ' '
  }).join(';');
  str += ')';
  return str;
}

function space(number) {
  return new Array(number + 1).join(' ');
}


module.exports = function (file, cfg) {
  file = path.resolve(file);

  cfg = defCfg;
  quoteReg = new RegExp('#{?(' +
    Object.keys(cfg.directives).join('|') +
    ')}?\\(\\s*([\'\"])([^\\)]+)\\2\\)', 'g');

  tree(cwd, path.relative(cwd, file), cfg);
  console.log(files);
  //report(file, files);
}

