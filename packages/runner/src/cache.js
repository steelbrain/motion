import path from 'path'
import log from './lib/log'

type ViewArray = Array<string>
type ImportArray = Array<string>

type File = {
  views?: ViewArray,
  imports?: ImportArray
}

let baseDir
let installed = []
let files: { name: File } = {}
let name = f => path.relative(baseDir, f)

export default {
  setBaseDir(dir : string) {
    baseDir = path.resolve(dir, '..')
    log('baseDir', baseDir)
  },

  add(file: string) {
    if (!file) return
    files[name(file)] = files[name(file)] || {}
  },

  get(file: string) {
    return files[name(file)]
  },

  remove(file: string) {
    delete files[name(file)]
    log('remove', files)
  },

  setViews(file: string, views: ViewArray) {
    if (!file) return
    files[name(file)].views = views
    log('setViews', files)
  },

  setInstalled(_installed: array) {
    installed = _installed
  },

  getInstalled() {
    return installed
  },

  setImports(file: string, imports: ImportArray) {
    files[name(file)].imports = imports
    log('setImports', file, imports)
  },

  getViews(file?: string) {
    return files[name(file)].views
  },

  getImports(file?: string) {
    if (!file) {
      let allImports = []
      Object.keys(files).forEach(file => {
        allImports = allImports.concat(files[file].imports)
      })
      return allImports
    }

    return files[name(file)].imports
  }
}