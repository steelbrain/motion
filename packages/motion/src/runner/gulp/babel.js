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

export function file(opts) {
  return gulpStream({
    transformer: motionFile,
    opts
  })
}

export function app(opts) {
  return gulpStream({
    transformer: motionApp,
    opts
  })
}

function motionApp(file, cb) {
  let res = transform(
    file.contents.toString(),
    babelOpts(file, config.app())
  )

  cb({ res })
}

export function motionFile(file, cb) {
  let res = transform(
    file.contents.toString(),
    babelOpts(file, config.file(meta => {
      log.gulp('meta', meta)
      setTimeout(() =>
        cb({ res, meta })
      )
    }))
  )
}

function gulpStream({ transformer }) {
  return through.obj(function(file, enc, cb) {

    if (file.isNull() || path.extname(file.path) == '.json') {
      file.babel = {}
      cb(null, file)
      return
    }

    try {
      let hasCalledBack = false

      transformer(file, ({ res, meta }) => {
        if (hasCalledBack) return

        file.babel = meta

        if (file.sourceMap && res.map) {
          res.map.file = replaceExt(res.map.file, '.js')
          applySourceMap(file, res.map)
        }

        file.contents = new Buffer(res.code)
        file.path = replaceExt(file.path, '.js')
        this.push(file)
        hasCalledBack = true
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

function babelOpts(file, opts) {
  return Object.assign({}, opts, {
    filename: file.path,
    filenameRelative: file.relative,
    sourceMap: Boolean(file.sourceMap)
  })
}


export default { file, app }
