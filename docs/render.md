# Render

```
$customer.address
  getaddress()
  getAddress()
  get("address")
  isAddress()

$customer.Address
  getAddress()
  getaddress()
  get("Address")
  isAddress()


All $ref will be converted to string.


The specified element is set with the given value. Velocity tries first the 'set' method on the element, then 'put' to make the assignment.


$foo.getBar()
  $foo.Bar

$data.setUser("jon")
  #set( $data.User = "jon" )

$data.getRequest().getServerName()
  $data.Request.ServerName
  ${data.Request.ServerName}


The right hand side (RHS) can be one of the following types:
  Variable reference
  String literal
  Property reference
  Method reference
  Number literal
  ArrayList
  Map


If the RHS is a property or method reference that evaluates to null, it will not be assigned to the LHS.
  #set( $result = $query.criteria("name") )
  #set( $result = $query.criteria("address") )
  The result of the first query is bill
  The result of the second query is bill

```
