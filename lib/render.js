var colorful = require('colorful');

var colors = ['white', 'red', 'yellow'];

function renderVar(data, fullPath, conf) {
  var item = data[fullPath];
  if (item.variable.length) {
    var output = item.relPath;
    if (conf.verbose) {
      output += position(item.variable);
    } else {
      output += occur(item.variable);
    }
    console.log(output);
  } else {
    console.log(item.relPath);
    console.log(colorful.gray('Not found specified variable.'));
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
      if (verbose) {
        output += position(item.variable);
      } else {
        output += occur(item.variable);
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


function renderVarPlain(data, fullPath, conf) {
  Object.keys(data).forEach(function(fullPath) {
    var item = data[fullPath];
    var output = '';
    if (item.variable.length) {
      output += item.relPath;
      if (conf.verbose) {
        output += position(item.variable);
      } else {
        output += occur(item.variable);
      }
      console.log(output);
    }
  });
}


function renderAllVars(data, fullPath, conf) {
  console.log(data);
}


function renderDep(data, fullPath, conf) {
  var reverse = conf.reverse;
  var item = data[fullPath];
  console.log(item.relPath);

  var morePaths = reverse ? item.parents : item.children;
  Object.keys(morePaths).forEach(function(p){
    var output = '  ' + colorful[colors[data[p].status]](data[p].relPath);
    if (conf.verbose) {
      if (conf.reverse) {
        output += position(data[p].children[fullPath]);
      } else {
        output += position(item.children[p]);
      }
    } else {
      if (conf.reverse) {
        output += occur(data[p].children[fullPath]);
      } else {
        output += occur(item.children[p]);
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
  output += colorful[colors[item.status]](item.relPath);
  if (upFullPath) {
    if (conf.verbose) {
      if (reverse) {
        output += position(item.children[upFullPath]);
      } else {
        output += position(data[upFullPath].children[fullPath]);
      }
    } else {
      if (conf.reverse) {
        output += occur(item.children[upFullPath]);
      } else {
        output += occur(data[upFullPath].children[fullPath]);
      }
    }
  }
  console.log(output);

  var downFullPath;
  var morePaths = reverse ? item.parents : item.children;
  Object.keys(morePaths).forEach(function(p) {
    renderDepRecursive(data, p, conf, indent + 2, fullPath);
  });
}


function occur(list) {
  if(list.length <= 1) {
    return '';
  } else {
    return ' ' + colorful.gray('(' + list.length + ')');
  }
}


function position(positions) {
  return ' ' + colorful.gray(
    positions.map(function(position) {
      return '[' + position[0] + ',' + position[1] + ']';
    }).join(' ')
  );
}


function space(amount) {
  return new Array(amount + 1).join(' ');
}


module.exports = function(data, conf) {
  var fullPath = conf.file;
  var reverse = conf.reverse;

  console.log();
  if (conf.variable) {
    if (conf.variable === '_') {
      renderAllVars(data, fullPath, conf);
    } else if (!conf.file) {
      renderVarPlain(data, fullPath, conf);
    } else if (conf.recursive) {
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
