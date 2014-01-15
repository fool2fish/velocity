var colorful = require('colorful');

var levels = ['debug', 'info', 'warn', 'error']
var logLevel = 'info';
process.argv.forEach(function(item, idx, list) {
  if (item.match(/^(--debug|-[a-zA-Z]*d[a-zA-Z]*)$/)) {
    logLevel = 'debug';
  }
});

module.exports = require('tracer').colorConsole({
  methods: levels,
  level: logLevel,

  format: "{{title}}: {{message}} ({{file}}: {{line}})",

  filters: {
    info: colorful.gray,
    warn: colorful.yellow,
    error: colorful.red
  },

  transport: function(data) {
    var title = data.title;
    if (levels.indexOf(title) >= levels.indexOf(logLevel)) {
      console.log(data.output)
    }
    if (title === 'error') {
      process.exit(1)
    }
  }
});