/**
 * set dump open and the path
 * file will be output to this path and the original context will be preserved such as the example
 */
module.exports = {
  root: './',
  template: './index.vm',
  context: './context.js',
  dump:true,
  output:'./data-dump.vm'
}
