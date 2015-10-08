type ViewArray = Array<string>
type ImportArray = Array<string>

type File = {
  views?: ViewArray,
  imports?: ImportArray
}

let files: { name: File } = {}

export default {
  add(file: string) {
    files[file] = {}
  },

  get(file: string) {
    return files[file]
  },

  remove(file: string) {
    delete files[file]
  },

  setViews(file: string, views: ViewArray) {
    files[file].views = views
  },

  setImports(file: string, imports: ImportArray) {
    files[file].imports = imports
  },

  getViews(file?: string) {
    return files[file].views
  },

  getImports(file?: string) {
    return files[file].imports
  }
}