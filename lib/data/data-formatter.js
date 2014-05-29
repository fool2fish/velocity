var utilx = require('utilx')
var STATS = require('./data-stats')
var beautify = require('js-beautify').js_beautify 

function expand(data) {
  if (utilx.isObject(data)) {
    var rt = {}
    var k
    for (k in data) {
      rt[k] = { __stats: STATS.CERTAIN }
      var v = data[k]
      var goon = utilx.isObject(v) || utilx.isArray(v)
      rt[k].__value = goon ? expand(v) : v
    }
    return rt
  }

  if (utilx.isArray(data)) {
    var rt = []
    data.forEach(function(v) {
      var goon = utilx.isObject(v) || utilx.isArray(v)
      rt.push({
        __stats: STATS.CERTAIN,
        __value: goon ? expand(v) : v
      })
    })
    return rt
  }
}


function clean(data) {
  if (utilx.isObject(data)) {
    var rt = {}
    var k
    for (k in data) {
      var n = data[k]

      if ((n.__stats === STATS.LEFT || n.__stats === STATS.DEFINE) && n.__origin)
        n = n.__origin

      var stats = n.__stats
      var v = n.__value

      if (stats === STATS.CERTAIN) {
        if (utilx.isObject(v) || utilx.isArray(v)) {
          rt[k] = clean(v)
        } else {
          rt[k] = v
        }
      } else if (stats === STATS.UNCERTAIN) {
        rt[k] = v || ''
      }
    }
    return rt
  }
  if (utilx.isArray(data)) {
    var rt = []
    data.forEach(function(n) {
      // n.__stats === STATS.LEFT is impossible
      var stats = n.__stats
      var v = n.__value
      if (stats === STATS.CERTAIN) {
        if (utilx.isObject(v) || utilx.isArray(v)) {
          rt.push(clean(v))
        } else {
          rt.push(v)
        }
      } else if (stats === STATS.UNCERTAIN) {
        rt.push(v || '')
      }
    })
    return rt
  }
}


function tostr(data) {
  var cloneData = func2str(data)
  var tempStr = require('util').inspect(cloneData, {depth: null})
  var str = ''

  var reg = /'\[\[\[\[function[\s\S]+?\}\]\]\]\]'|[\s\S]+?(?='\[\[\[\[|$)/g
  var match
  while((match = reg.exec(tempStr)) != null) {
    var matchStr = match[0]
    if (matchStr.indexOf('\'[[[[') === 0) {
      str += matchStr
             .replace(/'\[\[\[\[|\]\]\]\]'/g, '')
             .replace(/\\(\\|')/g, '$1')
    } else {
      str += matchStr
    }
  }
  str = beautify(str, { indent_size: 2 })
　str = str.replace(/\'\s*#foreach/g, '#foreach')
            .replace(/#end\s*\'/g, '#end')
  return str
}

function todata(data){
    return clean(data)
}

function todump(data){
    var cloneData = clean(data)
    cloneData = dumptraversal(cloneData)
    return cloneData
}

function func2str(data) {
  if (utilx.isObject(data)) {
    var rt = {}
    Object.keys(data).forEach(function(key) {
      rt[key] = func2str(data[key])
    })
    return rt
  }

  if (utilx.isArray(data)) {
    var rt = []
    data.forEach(function(item) {
      rt.push(func2str(item))
    })
  }

  if (utilx.isFunction(data)) {
    return '[[[[' + data.toString() + ']]]]'
  }

  return data
}

function dumptraversal(data,key){
    var head = '#foreach($value in $'+key+')'
    var count = '#if($foreach.count!=0),#end'
    var end = '#end'
    if (utilx.isObject(data)) {
        var rt = {}
        for(i in data){
            rt[i] = data[i]
            var v = rt[i]
            var _key = !key ? i : key+'.'+i
            var goon = utilx.isObject(v)
            goon ? (rt[i] = arguments.callee(v,_key)) : (function(){
                if(v ==''){
                    rt[i] = '$'+ _key
                }else if(utilx.isFunction(v)){
                    rt[i] = '$' + _key +'()'
                }else if(utilx.isArray(v)){
                    rt[i] = head+count
                    v.forEach(function(){
                        rt[i] += 'inner'
                    })
                    rt[i]+=end
                }
            })()
        }
        return rt
    }
    /*
    if (utilx.isArray(data)){
        var rt = []
        data.forEach(function(i,k){
            //rt.push(head+count+end)
            //var inner = ''
            var goon = utilx.isObject(i) || utilx.isArray(i)
           // goon ? rt.push(arguments.callee(i,k)) : (function(){
                

            //    rt[k] = []
                /*
                if(i ==''){
                    inner += '"$value"'
                    data[0] = head + count +inner + end
                }else{
                    var _i = ''
                    inner += '{'
                    for(j in i){
                        inner += (inner=='{'?'':',') + j+':'+'"$value.'+j+'"'
                        _i += data[0][j]
                    }
                    inner += '}'
                    if(_i == ''){
                        data[0] = head + count + inner + end
                    }
                }
            //})()
        })
        return rt
    }*/
}

exports.expand = expand
exports.clean = clean
exports.todata = todata
exports.todump = todump
exports.tostr = tostr
