# VM Tokens

#### Attention

```
source: $\!name
expect: $!name
actual: $\!name

source: $method()
expect: illegal
actual: legal

source: $!obj.method()
expect: illegal
actual: legal

key of map must be literal
value of map must be literal or variable or property

$obj.method($a + $b) ?
no parentheses in arithmatic calculation?
```

#### Some examples

```
\$name \#{set} "string" $ $1 $!1 $\!name ${1} $!{1} $\!{name} ## comment
  ('CONTENT', '\$name \#{set} "string" $ $1 $!1 $\!name ${1} $!{1} $\!{name} ')
  ('SCOMMENT', '## comment')


$mud-Slinger_9}
  ('ID', '$mud-Slinger_9') ('CONTENT', '}')

$!mud-Slinger_9
  ('ID', '$!mud-Slinger_9')

${mud-Slinger_9}
  ('WID', '${mud-Slinger_9') ('}')

$!{mud-Slinger_9}
  ('WID', '$!{mud-Slinger_9') ('}')


$purchase.Total
  ('ID', '$purchase') ('ATTR', '.Total')

${purchase.Total}
  ('WID', '${purchase') ('ATTR', '.Total') ('}')


$obj.method( $a + $b, $c.method($d), "dd${e}ff", 'g', [1..3], {"key":"value"})
  ('ID', '$obj') ('ATTR', '.method')
  ('(')
    ('ID', '$a') ('+') ('ID', '$b')
    (',') ('ID', '$c') ('ATTR', '.method') ('(') ('ID', '$d') (')')
    (',') ('DSTRING', '"dd${e}ff"')
    (',') ('SSTRING',"'g'")
    (',') ('[') ('NUMBER', 1) ('..') ('NUMBER', 3) (']')
    (',') ('{')
  (')')


$foo.bar[1].junk
  ('ID', '$foo') ('ATTR', '.bar') ('[') ('INTEGER', 1) (']') ('ATTR', '.junk')

$foo.bar()[1]
  ('ID', '$foo') ('ATTR', '.bar') ('(') (')') ('[') ('INTEGER', 1) (']')

$foo["apple"][4]
  ('ID', '$foo') ('[') ('DSTRING', '"apple"') (']') ('[') ('INTEGER', 4) (']')



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

#include( "disclaimer.txt", "opinion.txt" )
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


