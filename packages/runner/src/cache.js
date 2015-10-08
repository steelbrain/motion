import path from 'path'
import log from './lib/log'

type ViewArray = Array<string>
type ImportArray = Array<string>

type File = {
  views?: ViewArray,
  imports?: ImportArray
}

let baseDir
let files: { name: File } = {}
let name = f => path.relative(baseDir, f)

export default {
  setBaseDir(dir : string) {
    baseDir = path.resolve(dir, '..')
    log('baseDir', baseDir)
  },

  add(file: string) {
    files[name(file)] = {}
  },

  get(file: string) {
    return files[name(file)]
  },

  remove(file: string) {
    delete files[name(file)]
    log(files)
  },

  setViews(file: string, views: ViewArray) {
    files[name(file)].views = views
    log(files)

  },

  setImports(file: string, imports: ImportArray) {
    files[name(file)].imports = imports
    log(files)

  },

  getViews(file?: string) {
    return files[name(file)].views
  },

  getImports(file?: string) {
    return files[name(file)].imports
  }
}