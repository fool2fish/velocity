module.exports = {
  id: '00000001',
  user: {
    name: 'fool2fish',
    github: 'https://github.com/fool2fish',
    favorites: ['food', 'travel', 'comic', '...']
  },
  date: {
    weather: 'rain',
    year: 2014,
    month: 3,
    day: 28,
    format: function(y, m, d) {
      return y + ' - ' + m  + ' - ' + d
    }
  },
  foo: {
    noReturn: function(){}
  }
}
