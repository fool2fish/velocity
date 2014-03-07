# VM Tokens

```
1. illegal directives?
dose any string begin with # be treated as a directive?
#a
#1a
#{}

2. escape?
\#{end}  string or directive?
\${abc}  string or ref?
```

```
"a"
'b'
c
  ('CHAR', '"')
  ('CHAR', 'a')
  ('CHAR', '"')
  ('CHAR', '\n')
  ('CHAR', '\'')
  ('CHAR', 'b')
  ('CHAR', '\'')
  ('CHAR', '\n')
  ('CHAR', 'c')


$mud-Slinger_9
$!mud-Slinger_9
${mud-Slinger_9}
$!{mud-Slinger_9}


$purchase.Total
${purchase.Total}

$foo.bar[1].junk
$foo.callMethod()[1]
$foo["apple"][4]


$page.setTitle( "[$title}]", $subTitle )


#set( $monkey = $bill )
#set( $monkey.name = "$name")
#set( $monkey.Friend = 'monica' )
#set( $monkey.Blame = $whitehouse.Leak )
#set( $monkey.Plan = $spindoctor.weave($web) )
#set( $monkey.Number = 123 )
#set( $monkey.Numbers = [1..3] )
#set( $monkey.Say = ["Not", $my, "fault"] )
#set( $monkey.Map = {"banana" : "good", "roast beef" : "bad"} )

#set( $value = $foo + 1 )
#set( $value = $bar - 1 )
#set( $value = $foo * $bar )
#set( $value = $foo / $bar )
#set( $value = $foo % $bar )

#if($foo == $bar)
  it's true!
#{else}
  it's not!
#end

<table>
#foreach( $customer in $customerList )
    <tr><td>$foreach.count</td><td>$customer.Name</td></tr>
#end
</table>

#include( "disclaimer.txt" "opinion.txt" )
#include( $foo $bar )

#parse( "lecorbusier.vm" )
#parse( $foo )

#{?stop}?

#{?break}?

#evaluate( 'string with VTL #if(true)will be displayed#end' )
#evaluate( $foo )

#define( $hello ) Hello $who #end
#set( $who = "World!")
$hello

#{?macro}?(vmname $arg1 $arg2=$def2)
$arg1
$arg2
$!bodyContent
#{?end}?

#vmname( $arg1 $arg2 )
#@vmname( $arg1 $arg2 ) here is the body #end


## This is a comment.

#*
This is a multiline comment.
This is the second line
*#

#[[
This has invalid syntax that would normally need "poor man's escaping" like:

#define()
${blah
]]#

```


