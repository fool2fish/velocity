/**!
 * velocity - test/parser.test.js
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
var parser = require('../').parser
var utils = require('./utils')

describe('parser.test.js', function () {
  describe('Text', function () {
    it('should parse normal text', function () {
      var ast = parser.parse('Hello world')
      ast.type.should.equal('Statements')
      ast.body.should.length(1)
      ast.body[0].type.should.equal('Text')
      ast.body[0].value.should.equal('Hello world')
    })
  })

  describe('Reference => Identifier', function () {
    it('should parse a simple vm and return ast', function () {
      var ast = parser.parse('Hello, ${name}!\n$!foo 123')
      ast.body.should.length(5)

      ast.body[0].type.should.equal('Text')
      ast.body[0].value.should.equal('Hello, ')

      ast.body[1].type.should.equal('Reference')
      ast.body[1].object.type.should.equal('Identifier')
      ast.body[1].object.name.should.equal('name')
      ast.body[1].wrapped.should.equal(true)

      ast.body[2].type.should.equal('Text')
      ast.body[2].value.should.equal('!\n')

      ast.body[3].type.should.equal('Reference')
      ast.body[3].object.type.should.equal('Identifier')
      ast.body[3].object.name.should.equal('foo')
      ast.body[3].silent.should.equal(true)

      ast.body[4].type.should.equal('Text')
      ast.body[4].value.should.equal(' 123')
    })

    it('should parse simple Reference', function () {
      var ast = parser.parse('$name')
      ast.body.should.eql([
        { type: 'Reference',
          pos: { first_line: 1, last_line: 1, first_column: 0, last_column: 5 },
          object:
           { type: 'Identifier',
             pos: { first_line: 1, last_line: 1, first_column: 1, last_column: 5 },
             name: 'name' } }
      ])

      ast = parser.parse('${name}')
      ast.body.should.eql([
        { type: 'Reference',
          pos: { first_line: 1, last_line: 1, first_column: 0, last_column: 7 },
          object:
           { type: 'Identifier',
             pos: { first_line: 1, last_line: 1, first_column: 2, last_column: 6 },
             name: 'name' },
          wrapped: true }
      ])

      ast = parser.parse('$_ref')
      ast.body.should.eql([ {
        type: 'Reference',
        pos: { first_line: 1, last_line: 1, first_column: 0, last_column: 5 },
        object:
         { type: 'Identifier',
           pos: { first_line: 1, last_line: 1, first_column: 1, last_column: 5 },
           name: '_ref' } }
      ])
    })
  })

  describe('UnaryExpr', function () {
    it('should parse `#set($a = !$b)`', function () {
      var ast = parser.parse("#set($a = !$b)")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference')
      ast.body[0].left.object.type.should.equal('Identifier')
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].right.type.should.equal('UnaryExpr')
      ast.body[0].right.operator.should.equal('!')

      var argument = ast.body[0].right.argument
      argument.type.should.equal('Reference')
      argument.object.type.should.equal('Identifier')
      argument.object.name.should.equal('b')
    })
  })

  describe('AssignExpr', function () {
    it('should parse `#set($a = $b)`', function () {
      var ast = parser.parse("#set($a = $b)\nMap: { 'nick': '$map.nick' }")
      ast.body.should.length(4)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference') // $
      ast.body[0].left.object.type.should.equal('Identifier') // $xxx
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].right.type.should.equal('Reference')
      ast.body[0].right.object.type.should.equal('Identifier')
      ast.body[0].right.object.name.should.equal('b')

      ast.body[1].type.should.equal('Text')
      ast.body[1].value.should.equal("\nMap: { 'nick': '")

      ast.body[2].type.should.equal('Reference') // $
      ast.body[2].object.type.should.equal('Property') // $xx.yy
      ast.body[2].object.object.type.should.equal('Identifier')
      ast.body[2].object.object.name.should.equal('map')
      ast.body[2].object.property.type.should.equal('Prop')
      ast.body[2].object.property.name.should.equal('nick')

      ast.body[3].type.should.equal('Text')
      ast.body[3].value.should.equal("' }")
    })

    it('should parse `#set($a = 1)`', function () {
      var ast = parser.parse("#set($a = 1)")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference') // $
      ast.body[0].left.object.type.should.equal('Identifier') // $xxx
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].right.type.should.equal('Integer')
      ast.body[0].right.value.should.equal(1)
    })

    it('should parse `#set($a = \'\')`', function () {
      var ast = parser.parse("#set($a = '')")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference')
      ast.body[0].left.object.type.should.equal('Identifier')
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].right.type.should.equal('String')
      ast.body[0].right.value.should.equal('')

      var ast = parser.parse("#set($a = 'foo')")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference')
      ast.body[0].left.object.type.should.equal('Identifier')
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].right.type.should.equal('String')
      ast.body[0].right.value.should.equal('foo')

      var ast = parser.parse("#set($a = \"foo\")")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference')
      ast.body[0].left.object.type.should.equal('Identifier')
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].right.type.should.equal('DString')
      ast.body[0].right.value.should.equal('foo')
    })

    it('should parse `#set($a = $user.nick)`', function () {
      var ast = parser.parse("#set($a = $user.nick)")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference') // $
      ast.body[0].left.object.type.should.equal('Identifier') // $xxx
      ast.body[0].left.object.name.should.equal('a')

      ast.body[0].right.type.should.equal('Reference')
      ast.body[0].right.object.type.should.equal('Property') // $
      ast.body[0].right.object.object.type.should.equal('Identifier') // user
      ast.body[0].right.object.object.name.should.equal('user')
      ast.body[0].right.object.property.type.should.equal('Prop') // .nick
      ast.body[0].right.object.property.name.should.equal('nick')
    })

    it('should parse `#set(${a} = ${user.nick})`', function () {
      var ast = parser.parse("#set(${a} = ${user.nick})")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')
      ast.body[0].left.type.should.equal('Reference') // $
      ast.body[0].left.object.type.should.equal('Identifier') // $xxx
      ast.body[0].left.object.name.should.equal('a')
      ast.body[0].left.wrapped.should.equal(true)

      ast.body[0].right.type.should.equal('Reference')
      ast.body[0].right.object.type.should.equal('Property') // $
      ast.body[0].right.object.object.type.should.equal('Identifier') // user
      ast.body[0].right.object.object.name.should.equal('user')
      ast.body[0].right.object.property.type.should.equal('Prop') // .nick
      ast.body[0].right.object.property.name.should.equal('nick')
      ast.body[0].right.wrapped.should.equal(true)
    })

    it('should parse `#set($your.name = $user.nick)`', function () {
      var ast = parser.parse("#set($your.name = $user.nick)")
      ast.body.should.length(1)

      ast.body[0].type.should.equal('AssignExpr')
      ast.body[0].should.have.property('left')
      ast.body[0].should.have.property('right')

      ast.body[0].left.type.should.equal('Reference') // $
      ast.body[0].left.object.type.should.equal('Property')
      ast.body[0].left.object.object.type.should.equal('Identifier') // your
      ast.body[0].left.object.object.name.should.equal('your')
      ast.body[0].left.object.property.type.should.equal('Prop') // .name
      ast.body[0].left.object.property.name.should.equal('name')

      ast.body[0].right.type.should.equal('Reference')
      ast.body[0].right.object.type.should.equal('Property') // $
      ast.body[0].right.object.object.type.should.equal('Identifier') // user
      ast.body[0].right.object.object.name.should.equal('user')
      ast.body[0].right.object.property.type.should.equal('Prop') // .nick
      ast.body[0].right.object.property.name.should.equal('nick')
    })
  })

  describe('DString', function () {
    it('shold parse #set($a = "$foo bar")', function () {
      var ast = parser.parse('#set($a = "$foo bar")')
      ast.body.should.length(1)
      ast.body[0].right.type.should.equal('DString')
      ast.body[0].right.value.should.equal('$foo bar')
    })
  })

  describe('Reference => Property', function () {
    it('should parse `$map.nick`', function () {
      var ast = parser.parse("{ 'nick': '$map.nick' }")
      ast.body.should.length(3)

      ast.body[0].type.should.equal('Text')
      ast.body[0].value.should.equal("{ 'nick': '")

      ast.body[1].type.should.equal('Reference') // $
      ast.body[1].object.type.should.equal('Property') // $xx.yy
      ast.body[1].object.object.type.should.equal('Identifier')
      ast.body[1].object.object.name.should.equal('map')
      ast.body[1].object.property.type.should.equal('Prop')
      ast.body[1].object.property.name.should.equal('nick')

      ast.body[2].type.should.equal('Text')
      ast.body[2].value.should.equal("' }")
    })

    it('should parse `${map.nick}`', function () {
      var ast = parser.parse("{ 'nick': '${map.nick}Haha' }")
      ast.body.should.length(3)

      ast.body[0].type.should.equal('Text')
      ast.body[0].value.should.equal("{ 'nick': '")

      ast.body[1].type.should.equal('Reference') // $
      ast.body[1].object.type.should.equal('Property') // $xx.yy
      ast.body[1].object.object.type.should.equal('Identifier')
      ast.body[1].object.object.name.should.equal('map')
      ast.body[1].object.property.type.should.equal('Prop')
      ast.body[1].object.property.name.should.equal('nick')
      ast.body[1].wrapped.should.equal(true)

      ast.body[2].type.should.equal('Text')
      ast.body[2].value.should.equal("Haha' }")
    })

    it('should parse `$dateHelper.isHourBefore(11)`', function () {
      var ast = parser.parse("$dateHelper.isHourBefore(11)")
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('Reference') // $
      obj = obj.object
      obj.type.should.equal('Method') // $xx.foo(arg, ...)
      obj.callee.type.should.equal('Property')
      var callee = obj.callee
      callee.object.type.should.equal('Identifier')
      callee.object.name.should.equal('dateHelper')
      callee.property.type.should.equal('Prop')
      callee.property.name.should.equal('isHourBefore')

      obj.arguments.should.length(1)
      obj.arguments[0].type.should.equal('Integer')
      obj.arguments[0].value.should.equal(11)
    })

    it('should parse `$user.name()`', function () {
      var ast = parser.parse("$user.name()")
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('Reference') // $
      obj = obj.object
      obj.type.should.equal('Method') // $xx.foo(arg, ...)
      obj.callee.type.should.equal('Property')
      var callee = obj.callee
      callee.object.type.should.equal('Identifier')
      callee.object.name.should.equal('user')
      callee.property.type.should.equal('Prop')
      callee.property.name.should.equal('name')

      obj.arguments.should.length(0)
    })
  })

  describe('if else', function () {
    it('should parse inline #if-else', function () {
      var ast = parser.parse('#if($a)foo#else b#end')
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')
      obj.test.type.should.equal('Reference')
      obj.test.object.name.should.equal('a')
      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('foo')
      obj.alternate.type.should.equal('Statements')
      obj.alternate.body.should.length(1)
      obj.alternate.body[0].type.should.equal('Text')
      obj.alternate.body[0].value.should.equal(' b')
    })

    it('should parse #if($a || $b)', function () {
      var ast = parser.parse('#if($a || $b)\nok\n#end')
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')
      var test = obj.test;
      test.type.should.equal('BinaryExpr')
      test.operator.should.equal('||')
      var left = test.left
      left.type.should.equal('Reference')
      left.object.name.should.equal('a')
      var right = test.right
      right.type.should.equal('Reference')
      right.object.name.should.equal('b')
      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\nok\n')
    })

    it('should parse #if($a || $b || $c)', function () {
      var ast = parser.parse('#if($a || $b || $c)\nok\n#end')
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')
      var test = obj.test;
      test.type.should.equal('BinaryExpr')
      test.operator.should.equal('||')
      var left = test.left
      left.type.should.equal('BinaryExpr')
      left.operator.should.equal('||')
      left.left.type.should.equal('Reference')
      left.left.object.name.should.equal('a')
      left.right.type.should.equal('Reference')
      left.right.object.name.should.equal('b')

      var right = test.right
      right.type.should.equal('Reference')
      right.object.name.should.equal('c')
      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\nok\n')
    })

    it('should parse #if($a || $b && $c)', function () {
      var ast = parser.parse('#if($a || $b && $c)\nok\n#end')
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')
      var test = obj.test;
      test.type.should.equal('BinaryExpr')
      test.operator.should.equal('||')
      var left = test.left
      left.type.should.equal('Reference')
      left.object.name.should.equal('a')

      var right = test.right
      right.type.should.equal('BinaryExpr')
      right.operator.should.equal('&&')
      right.left.type.should.equal('Reference')
      right.left.object.name.should.equal('b')
      right.right.type.should.equal('Reference')
      right.right.object.name.should.equal('c')

      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\nok\n')
    })

    it('should parse #if(($a || $b) && $c)', function () {
      var ast = parser.parse('#if(($a || $b) && $c)\nok\n#end')
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')
      var test = obj.test;
      test.type.should.equal('BinaryExpr')
      test.operator.should.equal('&&')
      var left = test.left
      left.type.should.equal('BinaryExpr')
      left.operator.should.equal('||')
      left.left.type.should.equal('Reference')
      left.left.object.name.should.equal('a')
      left.right.type.should.equal('Reference')
      left.right.object.name.should.equal('b')

      var right = test.right
      right.type.should.equal('Reference')
      right.object.name.should.equal('c')

      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\nok\n')
    })

    it('should parse #if(!$a)', function () {
      var ast = parser.parse('#if(!$a)\nok\n#end')
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')
      var test = obj.test;
      test.type.should.equal('UnaryExpr')
      test.operator.should.equal('!')
      var argument = test.argument
      argument.type.should.equal('Reference')
      argument.object.name.should.equal('a')
      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\nok\n')
    })

    it('should parse #if #end', function () {
      var ast = parser.parse(utils.string('if-end.vm').trim())
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')

      obj.test.type.should.equal('Reference')
      var test = obj.test.object
      test.type.should.equal('Method')
      test.callee.type.should.equal('Property')
      test.callee.object.name.should.equal('user')
      test.callee.property.name.should.equal('getAge')
      test.arguments.should.length(1)
      test.arguments[0].type.should.equal('Integer')
      test.arguments[0].value.should.equal(18)

      obj.consequent.type.should.equal('Statements')
      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\n  welcome board\n')
    })

    it('should parse #if #else #end', function () {
      var ast = parser.parse(utils.string('if-else-end.vm').trim())
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')

      obj.test.type.should.equal('Reference')
      var test = obj.test.object
      test.type.should.equal('Method')
      test.callee.type.should.equal('Property')
      test.callee.object.name.should.equal('user')
      test.callee.property.name.should.equal('getAge')
      test.arguments.should.length(1)
      test.arguments[0].type.should.equal('Integer')
      test.arguments[0].value.should.equal(18)

      obj.consequent.type.should.equal('Statements')
      obj.consequent.body.should.length(1)
      obj.consequent.body[0].type.should.equal('Text')
      obj.consequent.body[0].value.should.equal('\n  welcome board\n')

      should.exist(obj.alternate)
      obj.alternate.type.should.equal('Statements')
      obj.alternate.body.should.length(1)
      obj.alternate.body[0].type.should.equal('Text')
      obj.alternate.body[0].value.should.equal('\n  this is else\n')
    })

    it('should parse #if #elseif #end', function () {
      var ast = parser.parse(utils.string('if-elseif-end.vm').trim())
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')

      var test = obj.test;
      test.type.should.equal('Reference')
      test.object.type.should.equal('Identifier')
      test.object.name.should.equal('a')
      obj.consequent.type.should.equal('Statements')
      obj.consequent.body.should.length(3)

      obj.alternate.type.should.equal('If')
      var alternate = obj.alternate
      alternate.test.type.should.equal('Reference')
      alternate.test.object.type.should.equal('Identifier')
      alternate.test.object.name.should.equal('b')
      alternate.consequent.type.should.equal('Statements')
      alternate.consequent.body.should.length(3)

      should.not.exist(alternate.alternate)
    })

    it('should parse #if #elseif #elseif #end', function () {
      var ast = parser.parse(utils.string('if-elseif-elseif-end.vm').trim())
      ast.body.should.length(1)
      var obj = ast.body[0]
      obj.type.should.equal('If')

      var test = obj.test;
      test.type.should.equal('Reference')
      test.object.type.should.equal('Identifier')
      test.object.name.should.equal('a')
      obj.consequent.type.should.equal('Statements')
      obj.consequent.body.should.length(3)

      obj.alternate.type.should.equal('If')
      var alternate = obj.alternate
      alternate.test.type.should.equal('Reference')
      alternate.test.object.type.should.equal('Identifier')
      alternate.test.object.name.should.equal('b')
      alternate.consequent.type.should.equal('Statements')
      alternate.consequent.body.should.length(3)

      should.exist(alternate.alternate)

      alternate = obj.alternate.alternate
      alternate.test.type.should.equal('Reference')
      alternate.test.object.type.should.equal('Identifier')
      alternate.test.object.name.should.equal('c')
      alternate.consequent.type.should.equal('Statements')
      alternate.consequent.body.should.length(3)
    })
  })

  describe('Macro', function() {
    it('should define a macro', function() {
      var ast = parser.parse('#macro(a)#end')
      ast.body[0].type.should.equal('Macro')
      ast.body[0].name.should.equal('a')

      ast = parser.parse('#macro(_a)#end')
      ast.body[0].type.should.equal('Macro')
      ast.body[0].name.should.equal('_a')

      ast = parser.parse('#macro(a-)#end')
      ast.body[0].type.should.equal('Macro')
      ast.body[0].name.should.equal('a-')

      ast = parser.parse('#macro(a1)#end')
      ast.body[0].type.should.equal('Macro')
      ast.body[0].name.should.equal('a1')

      parser.parse.bind('#macro(a*)#end').should.throw()

      parser.parse.bind('#macro(1a)#end').should.throw()
    })
  })

  describe('MacroCall', function() {
    it('should call a macro', function() {
      var ast = parser.parse('#a()')
      ast.body[0].type.should.equal('MacroCall')
      ast.body[0].name.should.equal('a')

      ast = parser.parse('#1a()')
      ast.body[0].type.should.equal('Text')

      ast = parser.parse('#a*()')
      ast.body[0].type.should.equal('Text')

      ast = parser.parse('#_a()')
      ast.body[0].type.should.equal('MacroCall')
      ast.body[0].name.should.equal('_a')

      ast = parser.parse('#a-()')
      ast.body[0].type.should.equal('MacroCall')
      ast.body[0].name.should.equal('a-')

      ast = parser.parse('#a1()')
      ast.body[0].type.should.equal('MacroCall')
      ast.body[0].name.should.equal('a1')

      ast = parser.parse('#_if()')
      ast.body[0].type.should.equal('MacroCall')
      ast.body[0].name.should.equal('_if')

      ast = parser.parse('#define1()')
      ast.body[0].type.should.equal('MacroCall')
      ast.body[0].name.should.equal('define1')
    })
  })
})
