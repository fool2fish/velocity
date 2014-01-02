var colorful = require('colorful');

var logLevel = 'warn';
process.argv.forEach(function(item, idx, list) {
  if (item.match(/^(--debug|-[a-zA-Z]*d[a-zA-Z]*)$/)) {
    logLevel = 'debug';
  }
});

module.exports = require('tracer').colorConsole({
  level: logLevel,
  format: "{{title}}: {{message}} ({{file}}: {{line}})",
  preprocess: function(data) {
    data.title = data.title.toUpperCase();
  },
  filters: {
    //log: colorful.gray,
    //trace: colorful.gray,
    debug: colorful.gray,
    info: colorful.white,
    warn: colorful.yellow,
    error: colorful.red
  }
});