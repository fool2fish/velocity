# VM Tokens

```
"plain" 'text' line


$!{mud-Slinger_9}
<'VARIABLE', 'mud-Slinger_9'>


${purchase.Total}
<'PROPERTY', 'purchase.Total'>


$page.setTitle( "title: $mainTitle", $subTitle )
<'METHOD', 'page.setTitle'>
<'('>
<"DSTRING", 'title: $mainTitle'>
<','>
<'VARIABLE', 'subTitle'>
<')'>


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


