/**!
 * velocity - test/engine.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict'

/**
 * Module dependencies.
 */

var should = require('should')
var path = require('path')
var Engine = require('../').Engine

var fixtures = path.join(path.dirname(__dirname), 'examples')

describe('engine.test.js', function () {
  describe('render()', function () {
    it('should render a simple vm', function () {
      var engine = new Engine({
        template: path.join(fixtures, 'hello', 'index.vm')
      })

      engine.render({name: 'fengmk2'}).should.equal('Hello, fengmk2!\n')
    })
  })
})
