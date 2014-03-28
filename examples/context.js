module.exports = {
  user: '>>>> user <<<<<',
  userNotActive: '==== user not active ===',
  name: 'fool2fish',
  info: {
    job: 'developer',
    lang: 'node'
  },
  list: ['first', 'second', 'third'],
  method: {
    foo: function(){return 'method return'},
    date: function(y, m, d) {
      return y + ' - ' + m + ' - ' + d
    }
  },
  eval: '$name'
}
