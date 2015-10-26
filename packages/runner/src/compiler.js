import npm from './npm'
import log from './lib/log'
import cache from './cache'
import gutil from 'gulp-util'
import through from 'through2'

let views = []
let emit
let OPTS

const isNotIn = (x,y) => x.indexOf(y) == -1

// this is missing the first brace ")" instead of "})"
// because this is being *added* to the line, which is previously }
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
const getWrapper = view => 'Flint.' + capitalize(view) + 'Wrapper'

const shortFile = file => file.replace(OPTS.dir.replace('.flint', ''), '')
const filePrefix = file => `!function() { return Flint.file('${shortFile(file)}', function(exports) { "use strict";`
const fileSuffix = ' }) }();'

const makeHash = (str) =>
  str.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)

const viewOpen = (name, hash, params) =>
  'Flint.view("' + name + '", "' + hash + '", (view, on) => {'

const viewMatcher = /^view\s+([\.A-Za-z_0-9]*)\s*\{/
const viewReplacer = (match, name, params) => {
  const hash = makeHash(views[name] ? views[name].contents.join("") : ''+Math.random())
  return viewOpen(name, hash, params);
}

const tagMatcher = /^tag\s+([a-z\-\*]+)/
const tagReplacer = (_, name) => `Flint.tag["${name}"] = `

let debouncers = {}
function debounce(key, cb, time) {
  if (debouncers[key])
    clearTimeout(debouncers[key])

  debouncers[key] = setTimeout(cb, time)
}

var Parser = {
  init(opts) {
    OPTS = opts || {}
  },

  post(file, source) {
    debounce(file, () => npm.scanFile(file, source), 400) // scan for imports
    source = filePrefix(file) + source + fileSuffix // add file
    return { source }
  },

  pre(file, source) {
    let currentView = { name: null, contents: [] }
    let inJSX = false
    let inView = false
    let fileViews = []

    const startRender = () => `__.render = () => <${getWrapper(currentView.name)} view={this}>`
    const endRender = () => `</${getWrapper(currentView.name)}>\n`

    source = source
      .replace(/\^/g, '__.props.')
      .split("\n")
      .map((line, index) => {
        let result = line
        let view = result.match(viewMatcher);
        if (view && view.length) {
          inView = true;
          currentView.name = result.split(' ')[1];
          // track view in file
          fileViews.push(currentView.name)
        }

        const JSXstart = line.charAt(2) == '<' && line.charAt(3) != '/'

        if (JSXstart)
          result = ';' + result.substr(1)

        // store view contents for hashing
        if (inView) {
          result = result.replace(/\$\.([A-Za-z0-9]+\s*\=)/, '$_class_$1')
          currentView.contents.push(result)
        }

        // end view
        if (inView && line.charAt(0) == '}') {
          inView = false
          views[currentView.name] = currentView
          currentView = { name: null, contents: [] }
        }

        return result
      })
      // .map(line => {
        // we have to do this after the first run because
        // we only have the replacer hash of the view *after*
        // we've already looped over it
        // return line.replace(viewMatcher, viewReplacer)
        //   .replace(tagMatcher, tagReplacer) // test
      // })
      .join("\n")

    if (!OPTS.build) {
      cache.add(file)
      cache.setViews(file, fileViews)
    }

    // console.log('transformed source', source)
    return { source }
  }
}

function compile(type, opts = {}) {
  if (type == 'init')
    return Parser.init(opts)

  return through.obj(function(file, enc, next) {
    if (file.isNull()) {
      next(null, file)
      return
    }

    try {
      let res = Parser[type](file.path, file.contents.toString(), opts)
      file.contents = new Buffer(res.source)
      this.push(file)
    }
    catch (err) {
      this.emit('error',
        new gutil.PluginError('flint', err, {
          fileName: file.path,
          showProperties: false
        })
      )
    }

    next()
  })
}

export default compile