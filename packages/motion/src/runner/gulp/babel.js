import gutil from 'gulp-util'
import through from 'through2'
import applySourceMap from 'vinyl-sourcemaps-apply'
import replaceExt from 'replace-ext'
import { transform } from 'flint-babel-core'
import config from './lib/config'
import opts from '../opts'
import { _, path, log } from '../lib/fns'
import getMatches from '../lib/getMatches'

export function file(opts) {
  return babelStream({
    transformer: motionFile,
    opts
  })
}

export function app(opts) {
  return babelStream({
    transformer: motionApp,
    opts
  })
}

export default { file, app }

function babelOpts(file, opts) {
  return Object.assign({}, opts, {
    filename: file.path,
    filenameRelative: file.relative,
    sourceMap: Boolean(file.sourceMap)
  })
}

function motionApp(file) {
  let res = transform(
    file.contents.toString(),
    babelOpts(file, config.app())
  )
  return { res, file }
}

const babelRuntimeRegex =
  /require\(\'(babel-runtime[a-z-A-Z0-9\/]*)\'\)/g

const babelRuntimeRequire = src =>
  getMatches(src, babelRuntimeRegex, 1)

export function motionFile(file) {
  let track = {
    imports: [],
    isCold: false,
    isExported: false
  }

  const onImports = (imports : string) => track.imports.push(imports)
  const onExports = (exports : string) => track.isExported = true
  const onCold = (val : boolean) => track.isCold = val

  let res = transform(
    file.contents.toString(),
    babelOpts(file, config.file({
      onImports,
      onExports,
      onCold
    }))
  )

  const { usedHelpers, modules: { imports } } = res.metadata
  const importedHelpers = usedHelpers && usedHelpers.map(name => `babel-runtime/helpers/${name}`) || []
  const importNames = imports.map(i => i.source)

  let meta = {
    imports: _.uniq([].concat(
      importNames,
      (track.imports || []),
      (importedHelpers || []),
      babelRuntimeRequire(res.code)
    )),
    isExported: track.isExported,
    isHot: !track.isCold
  }

  log.gulp('meta', meta)

  return { res, meta }
}

function babelStream({ transformer }) {
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
