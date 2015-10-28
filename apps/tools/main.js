let id = Math.ceil(Math.random() * 10)

export const uid = () => id++
export const getType = value => Object.prototype.toString.call(value).slice(8, -1)

view Main {
  <link rel="stylesheet" property="stylesheet" href="__/static/tools.css" />
  <Errors />
  <Installer />
  <State />

  <Test if={window.__isDevingDevTools} />

  $ = {
    position: 'fixed',
    pointerEvents: 'none',
    top: 0, left: 0,
    right: 0, bottom: 0,
    zIndex: 2147483647
  }
}

view Test {
  let num = 0
  let str = 'hello'
  let obj = {
    one: 'two',
    three: 4,
    arr: [1,2,3,4]
  }

  <h1>
    inspect me
  </h1>

  $ = {
    pointerEvents: 'all'
  }
}


var assign = Object.assign
var keys = Object.keys

export function createFilterer(data, options) {
    options || (options = {});
    var cache = {};

    return function(query) {
        var subquery;

        if (!cache[query]) {
            for (var i = query.length - 1; i > 0; i -= 1) {
                subquery = query.substr(0, i);

                if (cache[subquery]) {
                    cache[query] = find(cache[subquery], query, options);
                    break;
                }
            }
        }

        if (!cache[query]) {
            cache[query] = find(data, query, options);
        }

        return cache[query];
    };
};

function find(data, query, options) {
    return keys(data).reduce(function(acc, key) {
        var value = data[key];
        var matches;

        if (isPrimitive(value)) {
            if (contains(query, key, options) || contains(query, value, options)) {
                acc[key] = value;
            }
        } else {
            if (contains(query, key, options)) {
                acc[key] = value;
            } else {
                matches = find(value, query, options);

                if (!isEmpty(matches)) {
                    assign(acc, pair(key, matches));
                }
            }
        }

        return acc;
    }, {});
}

function contains(query, string, options) {
  if(options.ignoreCase) {
    query = String(query).toLowerCase();
    return string && String(string).toLowerCase().indexOf(query) !== -1;
  } else {
    return string && String(string).indexOf(query) !== -1;
  }
}

function isPrimitive(value) {
  var t = getType(value);
  return t !== 'Object' && t !== 'Array';
}

function pair(key, value) {
  var p = {};
  p[key] = value;
  return p;
}





const PATH_DELIMITER = '.'

export function lens(data, path) {
    var p = path.split(PATH_DELIMITER);
    var segment = p.shift();

    if (!segment) {
        return data;
    }

    var t = getType(data);

    if (t === 'Array' && data[integer(segment)]) {
        return lens(data[integer(segment)], p.join(PATH_DELIMITER));
    } else if (t === 'Object' && data[segment]) {
        return lens(data[segment], p.join(PATH_DELIMITER));
    }
}

function integer(string) {
    return parseInt(string, 10);
}