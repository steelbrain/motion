import disk from './disk'
import handleError from './lib/handleError'
import opts from './opts'
import { _, log, path, writeJSON, emitter } from './lib/fns'
import util from 'util'

const relative = f => path.relative(baseDir, f).replace('.motion/.internal/out/', '')

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
  meta: object;
  externals: ImportArray;
  internals: ImportArray;
}

let previousCache: CacheState
let cache: CacheState = {
  files: {},
  meta: {},
  imports: [],
  fileMeta: {}
}

let baseDir = ''
let deleteFileCbs = []
let deleteViewCbs = []
let addViewCbs = []

function onSetExported(file, val) {
  // TODO: remove from either out or add to out
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

function getFile(path) {
  const file = cache.files[relative(path)]

  if (!file)
    throw new Error('No file found in cache, ' + path)

  return file
}

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

    emitter.on('debug', () => {
      print(`\n\n---------cache---------`)
      Cache.debug()
    })
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
    return getFile(file)
  },

  getAll() {
    return cache.files
  },

  getAllNames() {
    return Object.keys(cache.files)
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
    const cFile = getFile(file)
    onDeleteViews(_.difference(cFile.views, views))
    // onAddViews(_.difference(views, cFile.views))
    cFile.views = views
    log.cache('setViews', views)
  },

  setFileMeta(file: string, fileMeta: object) {
    cache.meta[relative(file)] = fileMeta
  },

  getFileMeta(file: string) {
    return cache.meta[relative(file)]
  },

  setFileSrc(file: string, src: string) {
    getFile(file).src = src
  },

  isInternal(file: string) {
    const f = getFile(file)
    return f && f.isInternal
  },

  setFileInternal(file: string, isInternal: boolean) {
    const name = relative(file)
    const f = Cache.get(file)

    const wasInternal = f.isInternal
    f.isInternal = isInternal

    if (wasInternal != isInternal)
      onSetExported(name, isInternal)

    if (process.children)
      process.children.server.send(JSON.stringify({
        type: 'cache',
        data: cache
      }))
  },

  getExported() {
    const result = Object.keys(cache.files)
      .map(name => cache.files[name].isInternal ? name : null)
      .filter(f => f != null)

    return result
  },

  setFileImports(file: string, imports: ImportArray) {
    let cacheFile = Cache.get(file) || Cache.add(file)
    let externals = imports
    let internals = _.remove(externals, n => n && n.charAt(0) == '.')
    cacheFile.externals = externals
    cacheFile.internals = internals
  },

  getFile(file:? string) {
    return getFile(file)
  },

  getViews(file?: string) {
    return getFile(file).views
  },

  _getFileKeys(key) {
    const result = _.flatten(Object.keys(cache.files).map(file => cache.files[file][key])).filter(x => !!x)
    return result
  },

  // npm
  getExternals(file?: string) {
    if (!file) return Cache._getFileKeys('externals')
    return getFile(file).externals
  },

  // ./local
  getInternals(file?: string) {
    if (!file) return Cache._getFileKeys('internals')
    return getFile(file).internals
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
    if (!file) return
    let n = relative(file)
    if (!cache.files[n]) Cache.add(n)
    cache.files[n].error = error
  },

  removeError(file : string) {
    const f = getFile(file)
    f.error = null
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
    log.cache('setWritten', time)
    Cache.get(file).writtenAt = time
  },

  setFileInstalling(file : string, val : boolean) {
    Cache.get(file).installing = val
  },

  isInstalling(file : string) {
    const f = getFile(file)
    return f ? f.installing : false
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
    print(util.inspect(cache, false, 10))
  }

}

export default Cache
