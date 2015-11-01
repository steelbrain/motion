import npm from './npm'
import log from './lib/log'
import findExports from './lib/findExports'
import cache from './cache'
import gutil from 'gulp-util'
import through from 'through2'

let views = []
let OPTS

const isNotIn = (x,y) => x.indexOf(y) == -1
const viewMatcher = /^view\s+([\.A-Za-z_0-9]*)\s*\{/

const filePrefix = path => `!function(){Flint.file('${cache.name(path)}',function(exports){`
const fileSuffix = ' }) }();'

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

    const isInternal = findExports(source)

    // wrap closure if not exports file
    if (OPTS.build || !isInternal)
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

    if (!OPTS.build) {
      cache.add(file)
      cache.setViews(file, viewNames)
    }

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