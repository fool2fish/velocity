var colorful = require('colorful');


function renderVar(data, conf, fullPath /*private params*/, depth, upFullPath) {
  depth = depth || 0;
  var reverse = conf.reverse;
  var item = data[fullPath];

  var output = indent(depth) + wrapPath(item, !item.variable.length);
  var decorator = conf.verbose ? position : occur;
  output += decorator(item.variable);
  console.log(output);

  if (conf.recursive) {
    var morePaths = reverse ? item.parents : item.children;
    Object.keys(morePaths).forEach(function(downFullPath) {
      renderVar(data, conf, downFullPath, depth + 1, fullPath);
    });
  }
}


function renderVarPlain(data, conf) {
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


function renderAllVars(data, conf, fullPath) {
  console.log(data);
}


function renderDep(data, conf, fullPath /*private params*/, depth, upFullPath) {
  depth = depth || 0;

  var reverse = conf.reverse;
  var item = data[fullPath];

  var output = indent(depth) + wrapPath(item);
  if (upFullPath) {
    var itemPositions = data[upFullPath].children[fullPath];
    var upPositions = item.children[upFullPath]
    var decorator = conf.verbose ? position : occur;

    if (reverse) {
      output += decorator(upPositions);
    } else {
      output += decorator(itemPositions);
    }
  }
  console.log(output);

  if (conf.recursive || !depth) {
    var morePaths = reverse ? item.parents : item.children;
    Object.keys(morePaths).forEach(function(downFullPath) {
      renderDep(data, conf, downFullPath , depth + 1, fullPath);
    });
  }
}


function renderDepPlain(data, conf) {
  var reverse = conf.reverse;
  var verbose = conf.verbose;
  Object.keys(data).forEach(function(fullPath) {
    var item = data[fullPath];
    var keys = Object.keys(item.parents);
    var amount = keys.length;
    if (amount) {
      if (verbose || !reverse) console.log(wrapPath(item) + occur(keys));
    } else {
      if (verbose || reverse) console.log(wrapPath(item, 1));
    }
  });
}


function wrapPath(item, x) {
  var status = item.status;
  var relPath = item.relPath;
  if (status === 0) {
    if (x) {
      return colorful.gray(relPath);
    } else {
      return relPath;
    }
  } else if (status === 1) {
    return colorful.red(relPath);
  } else {
    return colorful.yellow(relPath);
  }
}


function occur(list) {
  if (list.length <= 1) {
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


function indent(depth) {
  return new Array(2 * depth + 1).join(' ');
}


module.exports = function(data, conf) {
  var fullPath = conf.file;
  var reverse = conf.reverse;

  console.log();
  if (conf.variable) {
    if (conf.variable === '_') {
      renderAllVars(data, conf, fullPath);
    } else if (!fullPath) {
      renderVarPlain(data, conf, fullPath);
    } else if (conf.recursive) {
      renderVar(data, conf, fullPath);
    }
  } else {
    if (fullPath){
      renderDep(data, conf, fullPath);
    } else {
      renderDepPlain(data, conf, fullPath);
    }
  }
  console.log();
};
