/**!
 * velocity - test/engine.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should')
var path = require('path')
var Engine = require('../').Engine
var utils = require('./utils')

var tpl = path.join(path.dirname(__dirname), 'examples')
var fixtures = path.join(__dirname, 'fixtures')

describe('engine.test.js', function () {
  describe('render()', function () {
    it('should render a simple vm', function () {
      var engine = new Engine({
        template: path.join(tpl, 'hello', 'index.vm')
      })

      engine.render({name: 'fengmk2'}).should.equal('Hello, fengmk2!\n')
      engine.render({name: ''}).should.equal('Hello, !\n')
      engine.render({name: null}).should.equal('Hello, null!\n')
      engine.render({name: undefined}).should.equal('Hello, ${name}!\n')
      engine.render({}).should.equal('Hello, ${name}!\n')
    })

    it('should render $!id => "" when id not exist', function () {
      var engine = new Engine({
        template: 'ok $!id.'
      })
      engine.render({}).should.equal('ok .')
      engine.render({id: null}).should.equal('ok null.')
      engine.render({id: 123}).should.equal('ok 123.')
      engine.render({id: 'foo'}).should.equal('ok foo.')
    })

    it('should render with macro', function () {
      var engine = new Engine({
        template: path.join(tpl, 'macro', 'index.vm'),
        macro: path.join(tpl, 'macro', 'macro.vm'),
      })

      engine.render({
        name: 'fool2fish',
        github: 'https://github.com/fool2fish',
        favorites: ['food', 'travel', 'comic', '...']
      }).should.equal(utils.string('macro-result.txt'))
    })
  })
})
