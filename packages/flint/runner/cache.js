import disk from './disk'
import handleError from './lib/handleError'
import opts from './opts'
import { _, log, path, writeJSON } from './lib/fns'
import util from 'util'

const LOG = 'cache'
const relative = f => path.relative(baseDir, f).replace('.flint/.internal/out/', '')

type ViewArray = Array<string>
type ImportArray = Array<string>

type File = {
  views?: ViewArray;
  imports?: ImportArray;
  error?: object;
  src: string;
  meta: object;
}

type CacheState = {
  files: {
    name: File;
    time: Date;
  };
  externals: ImportArray;
  internals: ImportArray;
}

let previousCache: CacheState
let cache: CacheState = {
  files: {},
  imports: [],
  fileMeta: {}
}

let baseDir = ''
let deleteFileCbs = []
let deleteViewCbs = []
let addViewCbs = []

function onSetExported(file, val) {
  // debugger // TODO: remove from either out or add to out
}

function onDeleteFile({ name, file, state }) {
  deleteFileCbs.forEach(cb => cb({ name, file, state }))
}

function onDeleteViews(views) {
  views.forEach(view => deleteViewCbs.forEach(cb => cb(view)))
}

function onAddViews(views) {
  views.forEach(view => addViewCbs.forEach(cb => cb(view)))
}

const files = file => cache.files[relative(file)]

const Cache = {
  relative,

  async init() {
    if (!opts('reset')) {
      try {
        // read in previous cache
        const state = await disk.state.read()
        previousCache = state.cache

        Cache.setBaseDir(opts('appDir'))
      }
      catch(e) {
        handleError(e)
      }
    }

    previousCache = previousCache || {
      files: {}
    }
  },

  setBaseDir(dir : string) {
    baseDir = path.resolve(dir)
    log.cache('baseDir', baseDir)
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
    cache.files[n] = cache.files[n] || {}
    cache.files[n].added = Date.now()
    return cache.files[n]
  },

  update(file: string) {
    Cache.setWritten(file, Date.now())
    Cache.removeError(file)
  },

  get(file: string) {
    return files(file)
  },

  getAll() {
    return cache.files
  },

  getPrevious(file: string) {
    return previousCache.files[relative(file)]
  },

  restorePrevious(file: string) {
    const n = relative(file)
    cache.files[n] = previousCache.files[n]
  },

  onDeleteFile(cb) {
    deleteFileCbs.push(cb)
  },

  onDeleteView(cb) {
    deleteViewCbs.push(cb)
  },

  onAddView(cb) {
    addViewCbs.push(cb)
  },

  remove(file: string) {
    const name = relative(file)
    const state = cache.files[name]
    log.cache('remove', name)
    delete cache.files[name]
    onDeleteFile({ file, name, state })
  },

  setViews(file: string, views: ViewArray) {
    if (!file) return
    const cFile = files(file)
    onDeleteViews(_.difference(cFile.views, views))
    // onAddViews(_.difference(views, cFile.views))
    cFile.views = views
    log.cache('setViews', views)
  },

  setFileMeta(file: string, meta: object) {
    files(file).meta = meta
  },

  getFileMeta(file: string) {
    return files(file).meta
  },

  setFileSrc(file: string, src: string) {
    files(file).src = src
  },

  isInternal(file: string) {
    const f = files(file)
    return f && f.isInternal
  },

  setFileInternal(file: string, val: boolean) {
    const name = relative(file)
    const f = cache.files[name]

    if (!f) return

    const isInternal = f.isInternal
    cache.files[name].isInternal = val

    if (isInternal != val)
      onSetExported(name, val)
  },

  getExported() {
    log.cache('cache', 'getExported', cache.files)
    return Object.keys(cache.files)
      .map(name => cache.files[name].isInternal ? name : null)
      .filter(f => f != null)
  },

  setFileImports(file: string, imports: ImportArray) {
    let cacheFile = Cache.get(file) || Cache.add(file)
    let externals = imports
    let internals = _.remove(externals, n => n && n.charAt(0) == '.')
    cacheFile.externals = externals
    cacheFile.internals = internals
  },

  getFile(file:? string) {
    return files(file)
  },

  getViews(file?: string) {
    return files(file).views
  },

  _getFileKeys(key) {
    const result = _.flatten(Object.keys(cache.files).map(file => cache.files[file][key])).filter(x => !!x)
    return result
  },

  // npm
  getExternals(file?: string) {
    if (!file) return Cache._getFileKeys('externals')
    return files(file).externals
  },

  // ./local
  getInternals(file?: string) {
    if (!file) return Cache._getFileKeys('internals')
    return files(file).internals
  },

  // npm + local
  getImports(file?: string) {
    return [].concat(cache.getInterals(file), cache.getExternals(file))
  },

  getInternalImporters() {
    return Object.keys(cache.files).map(file => {
      let data = cache.files[file]
      return data.internals && data.internals.length && file
    }).filter(x => !!x)
  },

  addError(file : string, error : object) {
    if (!n) return

    let n = relative(file)

    if (!cache.files[n]) Cache.add(n)

    cache.files[n].error = error
  },

  removeError(file : string) {
    if (files(file))
      files(file).error = null
  },

  getLastError() {
    let paths = Object.keys(cache.files)
    let errors = paths.map(p => cache.files[p].error).filter(e => !!e)

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

  setWritten(file : string, time) {
    const f = files(file)
    log.cache('setWritten', time)
    if (f) f.writtenAt = time
  },

  serialize() {
    log.cache('serialize')
    disk.state.write((state, write) => {
      state.cache = cache
      log.cache('writing cache')
      write(state)
    })
  },

  debug() {
    console.log(util.inspect(cache, false, 10))
  }

}

export default Cache
