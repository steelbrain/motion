import bundler from './bundler'
import log from './lib/log'
import hasExports from './lib/hasExports'
import cache from './cache'
import opts from './opts'
import through from 'through2'
import handleError from './lib/handleError'

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

  async post(file, source, next) {
    try {
      log(LOG, 'compiler///post', file)

      // used to prevent hot reloads while importing new things
      const isInstalling = await bundler.willInstall(source)

      // scan for imports/exports
      const scan = () => bundler.scanFile(file, source)
      const scanImmediate = OPTS.build || !opts.get('hasRunInitialBuild')

      // debounced installs
      if (scanImmediate) scan()
      else debounce(file, 400, scan)

      // debounce more for uninstall
      if (!OPTS.build)
        debounce('removeOldImports', 3000, bundler.uninstall)

      // check internals
      const isInternal = hasExports(source)

      // wrap closure if not internal file
      if (!isInternal)
        source = filePrefix(file) + source + fileSuffix

      log(LOG, 'compiler:post'.yellow, 'isInternal', isInternal, 'isInstalling', isInstalling)
      next(source, { isInternal, isInstalling })
    }
    catch(e) {
      handleError(e)
      next()
    }
  },

  pre(file, source, next) {
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

    next(source)
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
      let res = Parser[type](file.path, file.contents.toString(), (source, fileProps = {}) => {
        file.contents = new Buffer(source || '')
        // add fileprops coming from compilers
        Object.assign(file, fileProps)
        this.push(file)
        next()
      })
    }
    catch (err) {
      this.emit('error', err)
      next()
    }
  })
}

export default compile
