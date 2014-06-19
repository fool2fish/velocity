module.exports = {
  util: {
    add: function(a, b) { return a + b }
  },
  user: {
    addr: function() {
      return {
        zipcode: '310000',
        city: 'Hangzhou'
      }
    }
  },
  method: {
    foo: function() {
      return {
        bar: function(arg) {
          return {
            any: true
          }
        },
        prop: 'I am a property'
      }
    }
  },
  arg: 'arg'
}
