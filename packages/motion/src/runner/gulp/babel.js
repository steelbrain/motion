import gutil from 'gulp-util'
import through from 'through2'
import applySourceMap from 'vinyl-sourcemaps-apply'
import replaceExt from 'replace-ext'
import { transform } from 'babel-core'
import config from './lib/config'
import opts from '../opts'
import { _, path, log } from '../lib/fns'
import getMatches from '../lib/getMatches'

const babelRuntimeRegex =
  /require\(\'(babel-runtime[a-z-A-Z0-9\/]*)\'\)/g
const babelRuntimeRequire = src =>
  getMatches(src, babelRuntimeRegex, 1)

function options(file) {
  return {
    filename: file.path,
    filenameRelative: file.relative,
    sourceMap: Boolean(file.sourceMap)
  }
}

export function file(opts) {
  return gulpStream({
    transformer: (file, cb) => {
      let sent = false
      const res = transform(file.contents.toString(), {
        ...options(file),
        ...config.file(meta => {
          // patch because idk why but babel hits Program.exit() twice
          if (sent) return
          sent = true

          log.gulp('meta', meta)

          // settimeout (transform is sync)
          setTimeout(() =>
            cb({ res, meta })
          )
        })
      })
    },
    opts
  })
}

export function app(opts) {
  return gulpStream({
    opts,
    transformer: (file, cb) => {
      let res = transform(file.contents.toString(), {
        ...options(file),
        ...config.app()
      })

      cb({ res })
    }
  })
}

function gulpStream({ transformer }) {
  return through.obj(function(file, enc, cb) {

    if (file.isNull() || path.extname(file.path) == '.json') {
      file.babel = {}
      cb(null, file)
      return
    }

    try {
      transformer(file, ({ res, meta }) => {
        file.babel = meta

        if (file.sourceMap && res.map) {
          res.map.file = replaceExt(res.map.file, '.js')
          applySourceMap(file, res.map)
        }

        file.contents = new Buffer(res.code)
        file.path = replaceExt(file.path, '.js')
        this.push(file)
        cb()
      })
    }
    catch(err) {
      this.emit('error', new gutil.PluginError('gulp-babel', err, {
        fileName: file.path,
        showProperties: false
      }))

      cb()
    }
  })
}

export default { file, app }
