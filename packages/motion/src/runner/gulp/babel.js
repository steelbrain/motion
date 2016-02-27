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

function motionApp(file) {
  let res = transform(
    file.contents.toString(),
    babelOpts(file, config.app())
  )
  return { res, file }
}

export function motionFile(file) {
  let meta

  let res = transform(
    file.contents.toString(),
    babelOpts(file, config.file(_ => meta = _))
  )

  log.gulp('meta', meta)
  return { res, meta }
}

function gulpStream({ transformer }) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull() || path.extname(file.path) == '.json') {
      file.babel = {}
      cb(null, file)
      return
    }

    try {
      const { meta, res } = transformer(file)

      file.babel = meta

      if (file.sourceMap && res.map) {
        res.map.file = replaceExt(res.map.file, '.js')
        applySourceMap(file, res.map)
      }

      file.contents = new Buffer(res.code)
      file.path = replaceExt(file.path, '.js')
      this.push(file)
    }
    catch(err) {
      this.emit('error', new gutil.PluginError('gulp-babel', err, {
        fileName: file.path,
        showProperties: false
      }))
    }

    cb()
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
