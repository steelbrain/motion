import _ from 'lodash'
import opts from './opts'
import path from 'path'
import log from './lib/log'

const LOG = 'cache'

const relative = f => path.relative(baseDir, f).replace('.flint/.internal/out/', '')

type ViewArray = Array<string>
type ImportArray = Array<string>

type File = {
  views?: ViewArray,
  imports?: ImportArray,
  error?: object
}

let files: { name: File } = {}
let imports: ImportArray = []
let baseDir = ''

let deleteFileCbs = []
let deleteViewCbs = []

function onSetExported(file) {
  // debugger // TODO: remove from either out or add to out
}

function onDeleteFile({ name, file, state }) {
  deleteFileCbs.forEach(cb => cb({ name, file, state }))
}

function onDeleteViews(views) {
  views.forEach(view => {
    deleteViewCbs.forEach(cb => cb(view))
  })
}

const Cache = {
  setBaseDir(dir : string) {
    baseDir = path.resolve(dir)
    log(LOG, 'baseDir', baseDir)
  },

  baseDir() {
    return baseDir
  },

  name(file : string) {
    return relative(file)
  },

  add(file: string) {
    if (!file) return
    const n = relative(file)
    files[n] = files[n] || {}
    return files[n]
  },

  get(file: string) {
    return files[relative(file)]
  },

  getAll() {
    return files
  },

  onDeleteFile(cb) {
    deleteFileCbs.push(cb)
  },

  onDeleteView(cb) {
    deleteViewCbs.push(cb)
  },

  remove(file: string) {
    const name = relative(file)
    const state = files[name]
    log(LOG, 'remove', name)
    delete files[name]
    onDeleteFile({ file, name, state })
  },

  setViews(file: string, views: ViewArray) {
    if (!file) return
    const cFile = files[relative(file)]
    onDeleteViews(_.difference(cFile.views, views))
    cFile.views = views
    log(LOG, 'setViews', files)
  },

  setImports(_imports: ImportArray) {
    log(LOG, 'setImports', _imports)
    imports = _imports
  },

  isExported(file: string) {
    const f = files[relative(file)]
    return f && f.isExported
  },

  setExported(file: string, val: boolean) {
    const name = relative(file)
    const f = files[name]

    if (!f) return

    const isExported = f.isExported
    files[name].isExported = val

    if (isExported != val)
      onSetExported(name, val)
  },

  getExported() {
    log(LOG, 'cache', 'getExported', files)
    return Object.keys(files)
      .map(name => files[name].isExported ? name : null)
      .filter(f => !!f)
  },

  setFileImports(file: string, imports: ImportArray) {
    log(LOG, 'setFileImports', file, imports);
    let cacheFile = Cache.get(file)

    if (!cacheFile)
      cacheFile = Cache.add(file)

    cacheFile.imports = imports
  },

  getViews(file?: string) {
    return files[relative(file)].views
  },

  getImports(file?: string) {
    if (!file) {
      let allImports = [].concat(imports)
      Object.keys(files).forEach(file => {
        const _imports = files[file].imports
        if (_imports && _imports.length)
          allImports = allImports.concat(_imports)
      })
      log(LOG, 'getImports: ', allImports)
      return allImports
    }

    return files[relative(file)].imports
  },

  addError(file : string, error : object) {
    if (files[relative(file)])
      files[relative(file)].error = error
  },

  removeError(file : string) {
    if (files[relative(file)])
      files[relative(file)].error = null
  },

  getLastError() {
    let paths = Object.keys(files)
    let errors = paths.map(p => files[p].error)
    errors = errors.filter(e => !!e)

    if (errors.length) {
      let latest = errors[0]

      errors.forEach(err => {
        if (err.timestamp > latest.timestamp)
          latest = err
      })

      return latest
    }

    return null
  },

}

export default Cache