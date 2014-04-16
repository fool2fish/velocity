module.exports = {
  id: '00000001',
  user: {
    name: 'fool2fish',
    prop: 'name',
    github: 'https://github.com/fool2fish',
    favorites: ['food', 'travel', 'comic', 'toomany','...']
  },
  
  allProducts:[  
    'book',
    'pen',
    'rubber'
  ],
  allProductsTwo:{  
    book:100,
    pen:50,
    rubber:10
  },
  customerList:[
    {name:'tom',age:50},
    {name:'jack',age:30},
    {name:'jane',age:22}
  ], 
  date: {
    weather: 'rain',
    year: 2014,
    month: 3,
    day: 28,
    format: function(y, m, d) {
      return y + ' - ' + m  + ' - ' + d
    }
  },
  method: {
    foo: function(){return 'method.foo() is called!'},
    bar: function(){}
  },
  dataForEval: '@@$user.name@@',
  rangeStart: 1,
  isTrue: false
}
