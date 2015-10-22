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
const viewEnd = name => `)`
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

const jsxPragma = '/** @jsx view.el */'

var Parser = {
  init(opts) {
    OPTS = opts || {}
  },

  post(file, source) {
    npm.scanFile(file, source) // scan for imports
    source = source.replace(jsxPragma, '') // remove pragma
    source = filePrefix(file) + source + fileSuffix // add file
    return { source }
  },

  pre(file, source) {
    let currentView = { name: null, contents: [] }
    let inJSX = false
    let inView = false
    let fileViews = []

    const startRender = () => `view.render = () => <${getWrapper(currentView.name)} view={view}>`
    const endRender = () => `</${getWrapper(currentView.name)}>\n`

    source = source
      .replace(/\^/g, 'view.props.')
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

        const shouldLeaveJSX = (
          inJSX && (
            line.charAt(0) == '}' ||
            isNotIn(['}', ' ', '<', '', ']', '/'], line.charAt(2))
          )
        )

        // ENTER jsx
        const hasJSX = line.trim().charAt(0) == '<'
        const isComment = l => l.trim().substr(0,2) == '//'

        // if entering jsx
        if (inView && !inJSX && hasJSX) {
          inJSX = true
          result = line.trim()
          result = startRender() + result
        }

        // ONLY JSX transforms
        if (inJSX) {
          // allow for starting comments
          if (isComment(result)) result = ''
        }

        // store view contents for hashing
        if (inView) {
          result = result.replace(/\$\.([A-Za-z0-9]+\s*\=)/, '$_class_$1')
          currentView.contents.push(result)
        }

        // end jsx
        if (shouldLeaveJSX) {
          result = endRender() + result
          inJSX = false
        }

        // end view
        if (inView && line.charAt(0) == '}') {
          result = result + viewEnd(currentView.name)
          inView = false
          views[currentView.name] = currentView
          currentView = { name: null, contents: [] }
        }

        return result
      })
      .map(line => {
        // we have to do this after the first run because
        // we only have the replacer hash of the view *after*
        // we've already looped over it
        return line.replace(viewMatcher, viewReplacer)
      })
      .join("\n")

    if (!OPTS.build) {
      cache.add(file)
      cache.setViews(file, fileViews)
    }

    source = jsxPragma + source

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