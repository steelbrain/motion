import bundler from '../bundler'
import cache from '../cache'
import opts from '../opts'
import { through } from './lib/helpers'
import { handleError, debounce } from '../lib/fns'

const isNotIn = (x,y) => x.indexOf(y) == -1
const viewMatcher = /^view\s+([\.A-Za-z_0-9]*)\s*\{/
let views = []

export const Scanner = {
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

export default compile