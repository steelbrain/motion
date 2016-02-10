import bundler from '../bundler'
import cache from '../cache'
import opts from '../opts'
import { through } from './lib/helpers'
import { handleError } from '../lib/fns'

const isNotIn = (x,y) => x.indexOf(y) == -1
const viewMatcher = /^view\s+([\.A-Za-z_0-9]*)\s*\{/

let views = []

export const Scanner = {
  async post(filePath, source, next) {
    try {
      const isInternal = cache.isInternal(filePath)
      const scan = () => bundler.scanFile(filePath, source)
      const scanNow = opts('build') || opts('watch') || !opts('hasRunInitialBuild')

      // scan now on startup or build
      if (scanNow) scan()
      // debounce during run
      else {
        debounce(filePath, 2000, scan)
      }

      // building, done
      if (opts('build') && !opts('watch')) {
        next(source, { isInternal })
        return
      }

      // used to prevent hot reloads while importing new things
      const willInstall = await bundler.willInstall(filePath)

      // debounced uninstall
      debounce('removeOldImports', 3000, bundler.uninstall)

      next(source, { isInternal, willInstall })
    }
    catch(e) {
      handleError(e)
      next()
    }
  },

  pre(filePath, source, next) {
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

    // TODO move this into babel
    if (filePath) {
      cache.add(filePath)
      cache.setViews(filePath, viewNames)
    }

    next(source)
  }
}

function compile(type) {
  return through.obj(function(file, enc, next) {
    if (file.isNull()) {
      next(null, file)
      return
    }

    try {
      let res = Scanner[type](file.path, file.contents.toString(), (source, fileProps = {}) => {
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


let debouncers = {}
function debounce(key, time, cb) {
  if (debouncers[key])
    clearTimeout(debouncers[key])

  debouncers[key] = setTimeout(cb, time)
}


export default compile