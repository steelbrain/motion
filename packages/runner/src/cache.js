import opts from './opts'
import path from 'path'
import log from './lib/log'

const name = f => path.relative(baseDir, f).replace('.flint/out/', '')

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

const Cache = {
  setBaseDir(dir : string) {
    baseDir = path.resolve(dir)
    log('cache: baseDir', baseDir)
  },

  baseDir() {
    return baseDir
  },

  name(file : string) {
    return name(file)
  },

  add(file: string) {
    if (!file) return
    const n = name(file)
    files[n] = files[n] || {}
    return files[n]
  },

  get(file: string) {
    return files[name(file)]
  },

  remove(file: string) {
    delete files[name(file)]
    log('cache: remove', files)
  },

  setViews(file: string, views: ViewArray) {
    if (!file) return
    files[name(file)].views = views
    log('cache: setViews', files)
  },

  setImports(_imports: ImportArray) {
    log('cache: setImports', _imports)
    imports = _imports
  },

  isExported(file: string) {
    return files[name(file)].isExported
  },

  setExported(file: string, val: boolean) {
    files[name(file)].isExported = val
  },

  getExported() {
    return Object.keys(files)
      .map(name => files[name].isExported ? name : null)
      .filter(f => !!f)
  },

  setFileImports(file: string, imports: ImportArray) {
    log('cache: setFileImports', file, imports);
    let cacheFile = Cache.get(file)

    if (!cacheFile)
      cacheFile = Cache.add(file)

    cacheFile.imports = imports
  },

  getViews(file?: string) {
    return files[name(file)].views
  },

  getImports(file?: string) {
    if (!file) {
      let allImports = [].concat(imports)
      Object.keys(files).forEach(file => {
        const _imports = files[file].imports
        if (_imports && _imports.length)
          allImports = allImports.concat(_imports)
      })
      log('cache: getImports: ', allImports)
      return allImports
    }

    return files[name(file)].imports
  },

  addError(file : string, error : object) {
    if (files[name(file)])
      files[name(file)].error = error
  },

  removeError(file : string) {
    if (files[name(file)])
      files[name(file)].error = null
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