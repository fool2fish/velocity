module.exports = {
  method: {
    foo: function () {
      // some comment
      var a = 10
      var b = '\' \t \\'
      return a + b
    },
    bar: function() {},
    __barReturn: {
      b: 1,
      c: undefined
    }
  },
  obj2: {
    name: 'fool2fish'
  }
}