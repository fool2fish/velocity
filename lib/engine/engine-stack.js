var logger = require('../logger')

module.exports = {
  get: function(key) {
    var ctx = this.context
    for (ctx; ctx; ctx = ctx.__parent) {
      if (ctx[key] !== undefined) return ctx[key]
    }
    return undefined
  },

  pushContext: function(context) {
    if (!this.context) {
      this.topContext = context
    }
    context.__parent = this.context
    this.context = context
    // logger.debug('Push context', this.context)
  },

  popContext: function() {
    this.context = this.context.__parent
    // logger.debug('Pop context', this.context)
  },

  pushTemplate: function(template) {
    // ogger.debug('Push template', template.raw)

    // NOTE
    // because of global macro and define
    // a template may occurs more than one time in a template chain
    // e.g.  ROOT<-A1<-B<-A2
    // A1 and A2 are the same thing
    // so when A2 is pushed to the chain
    // A.__parent points to B
    // we only use the chain top, so it dose't matter that A1.__parent is not right now
    // when A2 is popped out
    // we need A1.__parent points to ROOT
    // so .__history is required to do this thing
    template.__history = template.__history || []
    template.__history.push(template.__parent)
    template.__parent = this.template
    template.__macro = {}
    this.template = template
  },

  popTemplate: function() {
    // logger.debug('Pop template', this.template.raw)
    var templ = this.template
    var newTop = templ.__parent
    templ.__parent = templ.__history.pop()
    this.template = newTop
  }
}
