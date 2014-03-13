# Grammar

element     | reference  | int   | float     | exp      | string | eval string 
------------|----------- | ----- | --------- | -------------- | ------ | -----------
            | $a, $a.b <br/> $a[1], $a.b() | 1, -1 | 1.0, -1.0 | $a + $b<br/>$a > $b<br/>$a && $b | 'str'  | "str" 
param       |            |       |           | x                    
index       |            |       | x         | x 
range item  |            |       | x         | x              | x      | x
map key     |            |       |           | x
map value   |            |       |           | x
