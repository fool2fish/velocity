var colorful = require('colorful');


function renderVar(data, fullPath, conf) {
  var item = data[fullPath];
  if (item.variable.length) {
    console.log(item.relPath, colorful.gray('(occur: ' + item.variable.length + ')'));
    console.log(colorful.gray(position(item.variable)));
  } else {
    console.log(item.relPath);
    console.log('  Not found specified variable.');
  }
}

function renderVarRecursive(data, fullPath, conf /*private params*/, indent, upFullPath) {
  indent = indent || 0;
  var reverse = conf.reverse;
  var verbose = conf.verbose;
  var item = data[fullPath];

  var output = space(indent);
  if (item.notExists) {
    output += colorful.red(item.relPath);
  } else {
    if (item.variable.length) {
      output += item.relPath
      output += colorful.gray(' (occur: ' + item.variable.length + ')');
      if (verbose) {
        output += '\n' + space(indent);
        output += colorful.gray(position(item.variable));
      }
    } else {
      output += colorful.gray(item.relPath);
    }
  }
  console.log(output);

  var downFullPath;
  var morePaths = reverse ? item.parents : item.children;
  for (downFullPath in morePaths) {
    renderVarRecursive(data, downFullPath, conf, indent + 2, fullPath);
  }
}


function renderDep(data, fullPath, conf) {
  var reverse = conf.reverse;
  var item = data[fullPath];
  console.log(item.relPath);

  var morePaths = reverse ? item.parents : item.children;
  Object.keys(morePaths).forEach(function(p){
    var output = '  ' + data[p].relPath;
    if (conf.verbose) {
      if (conf.reverse) {
        output += ' ' + colorful.gray(position(data[p].children[fullPath]));
      } else {
        output += ' ' + colorful.gray(position(item.children[p]));
      }
    }
    console.log(output);
  });
}

function renderDepRecursive(data, fullPath, conf /*private params*/, indent, upFullPath) {
  indent = indent || 0;
  var reverse = conf.reverse;
  var item = data[fullPath];

  var output = space(indent);
  output += (item.notExists ? colorful.red(item.relPath) : item.relPath);
  if (upFullPath && conf.verbose) {
    if (reverse) {
      output += ' ' + colorful.gray(position(item.children[upFullPath]));
    } else {
      output += ' ' + colorful.gray(position(data[upFullPath].children[fullPath]));
    }
  }
  console.log(output);

  var downFullPath;
  var morePaths = reverse ? item.parents : item.children;
  Object.keys(morePaths).forEach(function(p) {
    renderDepRecursive(data, p, conf, indent + 2, fullPath);
  });
}


function position(positions) {
  return positions.map(function(position) {
          return '[' + position[0] + ',' + position[1] + ']';
        }).join(' ');
}


function space(amount) {
  return new Array(amount + 1).join(' ');
}


module.exports = function(data, conf) {
  var fullPath = conf.file;
  var reverse = conf.reverse;

  console.log();
  if (conf.variable) {
    if (conf.recursive) {
      renderVarRecursive(data, fullPath, conf);
    } else {
      renderVar(data, fullPath, conf);
    }
  } else {
    if (conf.recursive) {
      renderDepRecursive(data, fullPath, conf);
    } else {
      renderDep(data, fullPath, conf);
    }
  }
  console.log();
};
