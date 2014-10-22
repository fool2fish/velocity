module.exports = {
  string: 'string',
  emptyString: '',
  method: {
    foo: function() { throw new Error('I just want to throw an error') },
    bar: function() {
      return {
        toString: function() {
          throw new Error('I just want to throw an error when call toString method')
        }
      }
    }
  }
}
