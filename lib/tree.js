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
    children: {fullPath: [[line, col]], ...}
  },
  ...
*/}


function tree(root, relPath, cfg, parentFullPath) {
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
      var content = fs.readFileSync(fullPath, {
            encoding: cfg.encoding
          }).toString();
      var line, lineno = 0;

      while ((line = lineReg.exec(content)) != null) {
        lineno++;
        var matched;
        while ((matched = quoteReg.exec(line[0])) != null) {
          var cRoot = cfg.directives[matched[1]];
          var cRelPath = matched[3];
          var cFullPath = path.join(cRoot, cRelPath);

          if (!files[fullPath].children[cFullPath]) {
            files[fullPath].children[cFullPath] = [];
          }
          files[fullPath].children[cFullPath].push([lineno, matched.index]);

          if (recursive && path.extname(cFullPath) === '.vm') {
            tree(cRoot, cRelPath, cfg, fullPath);
          }
        }
      }

    } else {
      files[fullPath].notExists = true;
    }
  }

  if (parentFullPath) {
    files[fullPath].parents[parentFullPath] = true;
  }

}


function report(fullPath, data, indent) {
  indent = indent || 0;
  console.log(data);
}


module.exports = function (file, cfg) {
  file = path.resolve(file);

  cfg = defCfg;
  quoteReg = new RegExp('#{?(' +
    Object.keys(cfg.directives).join('|') +
    ')}?\\(\\s*([\'\"])([^\\)]+)\\2\\)', 'g');

  tree(cwd, path.relative(cwd, file), cfg);
  report(file, files);
}

