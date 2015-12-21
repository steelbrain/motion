import bundler from './bundler'
import log from './lib/log'
import hasExports from './lib/hasExports'
import cache from './cache'
import gutil from 'gulp-util'
import through from 'through2'

let views = []
let OPTS
const LOG = 'gulp'

const isNotIn = (x,y) => x.indexOf(y) == -1
const viewMatcher = /^view\s+([\.A-Za-z_0-9]*)\s*\{/

const filePrefix = path => `!function(){Flint.file('${cache.name(path)}',function(require, exports){`
const fileSuffix = `\n }) }();` // newline so it doesnt get commented out

let debouncers = {}
function debounce(key, time, cb) {
  if (debouncers[key])
    clearTimeout(debouncers[key])

  debouncers[key] = setTimeout(cb, time)
}

var Parser = {
  init(opts) {
    OPTS = opts || {}
  },

  post(file, source) {
    log(LOG, 'compiler/post', file)

    // scan for imports/exports
    const bundle = () => bundler.scanFile(file, source)

    // debounce installs when running
    if (OPTS.build) bundle()
    else debounce(file, 400, bundle)

    // debounce a lot to uninstall
    if (!OPTS.build)
      debounce('removeOldImports', 3000, bundler.uninstall)

    // check internals
    const isInternal = hasExports(source)
    log(LOG, 'ISINTERNAL'.yellow, isInternal)

    // wrap closure if not internal file
    if (!isInternal)
      source = filePrefix(file) + source + fileSuffix

    return { source, isInternal }
  },

  pre(file, source) {
    let inView = false
    let viewNames = []

    source = source
      .split("\n")
      .map((line, index) => {
        let result = line

        let view = result.match(viewMatcher);

        if (view && view.length) {
          inView = true
          viewNames.push(result.split(' ')[1])
        }

        const JSXstart = inView && (
          line.charAt(2) == '<' &&
          line.charAt(3) != '/'
        )

        if (JSXstart)
          result = ';' + result.substr(1)

        if (inView && line.charAt(0) == '}')
          inView = false

        return result
      })
      .join("\n")

    cache.add(file)
    cache.setViews(file, viewNames)

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
      file.contents = new Buffer(res.source || '')

      file.isInternal = res.isInternal

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
