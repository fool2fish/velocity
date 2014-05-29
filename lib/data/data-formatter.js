var utilx = require('utilx')
var STATS = require('./data-stats')
var beautify = require('js-beautify').js_beautify; 

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
  var tempData = func2str(data)
  var tempStr = require('util').inspect(tempData, {depth: null})
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

  return beautify(str, { indent_size: 2 })
}

function todata(data){
    return clean(data)
}

function todump(data){
    var tempStr = require('util').inspect(data, {depth: null})
    //console.log(tempStr)
    var tempData = dumptraversal(data)
    return tempData
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

function dumptraversal(ctx,k){
    for (i in ctx) {
        var t = ctx[i]
        var stats = t.__stats
        var value = t.__value
        var v = !k ? i : k+'.'+i
        if(utilx.isArray(value)){
            console.log(t)
            t.__value = ['#foreach($value in $'+v+')'+
                    '#if($foreach.count!=0),#end'+
                    '$value#end']
        }else{
            if(stats == STATS.UNCERTAIN){
                t.__value = '$'+v
            }
        }
        if(utilx.isObject(value)||utilx.isArray(value)){
            arguments.callee(value,v)
        }
    }
    return ctx;
}

exports.expand = expand
exports.clean = clean
exports.todata = todata
exports.todump = todump
exports.tostr = tostr

/*
 *
 * {
    id: {
        __stats: 'CERTAIN',
        __value: '000000001'
    },
    user: {
        __stats: 'CERTAIN',
        __value: {
            name: {
                __stats: 'CERTAIN',
                __value: 'fool2fish'
            },
            email: {
                __stats: 'CERTAIN',
                __value: 'fool2fish@gmail.com'
            },
            undefinedIsPreserved: {
                __stats: 'CERTAIN',
                __value: undefined
            },
            favorites: {
                __stats: 'CERTAIN',
                __value: [{
                    __stats: 'UNCERTAIN'
                }]
            }
        }
    },
    method: {
        __stats: 'CERTAIN',
        __value: {
            foo: {
                __stats: 'CERTAIN',
                __value: [Function]
            }
        }
    },
    g: {
        __stats: 'CERTAIN',
        __value: 'g'
    },
    favIdx: {
        __stats: 'UNCERTAIN'
    },
    arg: {
        __stats: 'UNCERTAIN'
    },
    order: {
        __stats: 'CERTAIN',
        __value: {
            orderId: {
                __stats: 'UNCERTAIN'
            },
            addr: {
                __stats: 'CERTAIN',
                __value: {
                    zipCode: {
                        __stats: 'UNCERTAIN'
                    },
                    city: {
                        __stats: 'UNCERTAIN'
                    },
                    country: {
                        __stats: 'UNCERTAIN'
                    }
                }
            }
        }
    },
    temp: {
        __stats: 'LEFT',
        __value: {
            __stats: 'BREAK'
        },
        __origin: undefined
    },
    addr: {
        __stats: 'LEFT',
        __value: {
            __stats: 'CERTAIN',
            __value: {
                zipCode: {
                    __stats: 'UNCERTAIN'
                },
                city: {
                    __stats: 'UNCERTAIN'
                },
                country: {
                    __stats: 'UNCERTAIN'
                }
            }
        },
        __origin: undefined
    },
    employeeList: {
        __stats: 'CERTAIN',
        __value: [{
            __stats: 'CERTAIN',
            __value: {
                name: {
                    __stats: 'UNCERTAIN'
                },
                email: {
                    __stats: 'UNCERTAIN'
                }
            }
        }]
    },
    ref: {
        __stats: 'CERTAIN',
        __value: {
            from: {
                __stats: 'CERTAIN',
                __value: {
                    child: {
                        __stats: 'UNCERTAIN'
                    }
                }
            }
        }
    },
    userInfo: {
        __stats: 'DEFINE',
        __origin: undefined
    },
    today: {
        __stats: 'CERTAIN',
        __value: {
            year: {
                __stats: 'UNCERTAIN'
            },
            month: {
                __stats: 'UNCERTAIN'
            },
            day: {
                __stats: 'UNCERTAIN'
            }
        }
    },
    h: {
        __stats: 'UNCERTAIN'
    },
    f: {
        __stats: 'LEFT',
        __value: {
            __stats: 'BREAK'
        },
        __origin: undefined
    },
    k: {
        __stats: 'UNCERTAIN'
    },
    j: {
        __stats: 'LEFT',
        __value: {
            __stats: 'BREAK'
        },
        __origin: undefined
    }
}*/
