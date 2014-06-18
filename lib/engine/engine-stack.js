var logger = require('../logger')

module.exports = {

  pushContext: function(context) {
    if (this.context) {
      context.__parent = this.context
    } else {
      this.topContext = context
    }
    this.context = context
    // logger.debug('Push context', this.context)
  },

  popContext: function() {
    // logger.debug('Pop context', this.context)
    if ('__parent' in this.context) {
      this.context = this.context.__parent
    } else {
      ; delete this.context
      ; delete this.topContext
    }
  },

  pushTemplate: function(template) {
    // logger.debug('Push template', template.raw)

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
    template.__macro = template.__macro || {}
    template.__define = template.__define || {}
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
