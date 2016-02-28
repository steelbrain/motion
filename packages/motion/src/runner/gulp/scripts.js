import { $, gulp, SCRIPTS_GLOB, out, isSourceMap } from './lib/helpers'
import { SuperStream, dirAddStream } from './lib/streams'
import { _, fs, path, debounce, p, rm, logError, log, emitter } from '../lib/fns'
import unicodeToChar from '../lib/unicodeToChar'
import { event } from './index'
import { findBabelRuntimeRequires } from '../lib/findRequires'
import babel from './babel'
import bridge from '../bridge'
import Cache from '../cache'
import builder from '../builder'
import bundler from '../bundler'
import scanner from './scanner'
import opts from '../opts'

const serializeCache = _.debounce(Cache.serialize, 600)
const hasFinished = () => hasBuilt() && opts('hasRunInitialInstall')
const hasBuilt = () => opts('hasRunInitialBuild')
const getAllImports = (src, imports) => [].concat(findBabelRuntimeRequires(src), imports)
const scanNow = () => opts('build') || opts('watch') || !opts('hasRunInitialBuild')
const isJSON = file => path.extname(file.path) == '.json'
const hotReloadable = file => hasBuilt() && file.babel.isHot

export function scripts({ inFiles = [], userStream }) {
  let State = {
    curFile: null,
    lastError: null,
    lastSaved: {},
    previouslyInstalled: {},
    awaitingScan: {},
    loaded: 0,
    total: inFiles.length,
    outsideSources: {}
  }

  emitter.on('debug', () => {
    print(`\n\n---------gulp state--------`)
    print(State)
  })

  const scripts = userStream || gulp.src(SCRIPTS_GLOB)
    .pipe($.if(opts('watching'), $.watch(SCRIPTS_GLOB, { readDelay: 1 })))
    .pipe($.if(file => file.event == 'unlink', $.ignore.exclude(true)))

  const superStream = new SuperStream()

  return (
    opts('watching') ?
    $.merge(scripts, dirAddStream(opts('appDir')), superStream.getStream()) :
    scripts
  )
      .pipe($.if(buildCheck, $.ignore.exclude(true)))
      .pipe($.fn(reset))
      .pipe($.plumber(catchError))
      .pipe($.fn(setLastFile))
      .pipe(scanner('pre'))
      .pipe($.sourcemaps.init())
      .pipe(babel.file())
      // json
      .pipe($.if(isJSON,
        $.multipipe(
          gulp.dest(opts('outDir')),
          $.fn(buildDone),
          $.ignore.exclude(true)
        )
      ))
      .pipe($.fn(processDependencies))
      .pipe($.fn(sendOutsideChanged)) // right after motion
      .pipe($.rename({ extname: '.js' }))
      .pipe($.fn(markFileSuccess))
      // internals after hot to keep bundle up to date
      .pipe($.if(file => file.babel.isExported && hasBuilt(),
        $.fn(file => {
          bundler.writeInternals({ force: true, reload: !file.babel.isHot })
        })
      ))
      // hot reload
      .pipe($.if(hotReloadable,
        $.multipipe(
          gulp.dest(opts('hotDir')),
          $.fn(hotReload)
        )
      ))
      // out to bundle
      .pipe($.if(checkWriteable,
        $.multipipe(
          $.sourcemaps.write('.'),
          gulp.dest(opts('outDir')),
          $.fn(buildDone)
        )
      ))
      // temporary bugfix because gulp doesnt work well with watch (pending gulp 4)
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())
      .pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn()).pipe($.fn())

  function markDone(file) {
    State.loaded++

    const done = State.loaded == State.total
    log.gulp('markDone', State.total, '/', State.loaded, done)

    // check if done, only run once
    if (done && !opts('hasRunInitialBuild')) {
      opts.set('finishingFirstBuild', true)
      file.finishingFirstBuild = true
    }
  }

  // only do on first run
  function buildCheck(file) {
    file.relPath = path.relative(opts('appDir'), file.path)

    // BUGFIX gulp sends deleted files through here, this filters them
    if (!file.contents)
      return true

    // already done with first build
    if (hasBuilt()) return false

    // hide behind cached flag for now
    if (!opts('cached')) {
      markDone(file)
      return false
    }

    const prevFile = Cache.getPrevious(file.relPath)
    if (!prevFile) return false

    let outMTime, srcMTime

    // read srcfile
    try { srcMTime = fs.statSync(file.relPath).mtime }
    catch(e) { return false }

    // read outfile
    try {
      const outFile = prevFile.babel.isExported
        ? path.join(opts('deps').dir, 'internal', file.relPath)
        : path.join(opts('outDir'), file.relPath)

      outMTime = fs.statSync(outFile).mtime
    }
    catch(e) {
      log.gulp('buildCheck', 'out file removed')
      markDone(file)
      return false
    }

    // final check
    const goodBuild = +outMTime > +srcMTime
    const goodCache = prevFile.added > srcMTime
    if (!goodBuild || !goodCache) return false
    return finish(true)

    function finish(restored = false) {
      markDone(file)

      if (restored) {
        Cache.restorePrevious(file.relPath)
        out.goodScript(file)
      }

      return restored
    }
  }

  function reset(file) {
    Cache.add(file.relPath)
    emitter.emit('script:start', file)
    State.lastError = false
    State.curFile = file
    file.startTime = Date.now()
    file.message = { startTime: file.startTime }
  }

  function catchError(error) {
    log.gulp('catchError', error)
    State.lastError = true
    out.badFile(State.curFile)

    error.timestamp = Date.now()
    error.stack = unicodeToChar(error.stack)

    logError(error, State.curFile)

    event.run('error', State.curFile, error)
    Cache.addError(error.fileName || '', error)

    if (error.fileName)
      error.file = path.relative(opts('appDir'), error.fileName)

    bridge.broadcast('compile:error', { error }, 'error')

    markDone(State.curFile)
    buildDone(State.curFile)
  }

  function setLastFile(file) {
    if (!opts('watching')) return
    let name = file.relPath
    if (name.charAt(0) != '/') name = '/' + name
    log.gulp(name)

    // add to message
    file.message = {
      ...file.message,
      name: name,
      path: file.path,
      compiledAt: file.startTime
    }

    State.curFile = file
  }

  function willInstall(path, imports) {
    if (State.awaitingScan[path]) return true
    const result = !!_.xor(imports, State.previouslyInstalled[path]).length
    State.previouslyInstalled[path] = [ ...imports ]
    return result
  }

  // sets isInternal and willInstall
  // for handling npm and bundling related things
  function processDependencies(file) {
    Cache.setFileInternal(file.relPath, file.babel.isExported)

    const scan = () => {
      Cache.setFileImports(file.relPath, file.babel.imports)
      bundler.scanFile(file)
      State.awaitingScan[file.relPath] = false
    }

    if (opts('watching')) {
      debounce('removeOldImports', 3000, bundler.uninstall)

      // check will install
      file.willInstall = willInstall(file.relPath, file.babel.imports)

      if (file.willInstall) {
        State.awaitingScan[file.relPath] = true
        superStream.avoidSending(file.relPath)
      }
    }

    // run scan
    if (file.babel.isExported || scanNow())
      scan()
    else
      debounce(`install:${file.relPath}`, 1600, scan)
  }

  // detects if a file has changed not inside views for hot reloads correctness
  function sendOutsideChanged(file) {
    let src = file.contents.toString()
    let meta = Cache.getFileMeta(file.path)

    if (!meta) return

    let changed = true
    const viewLocs = Object.keys(meta).map(view => meta[view].location)

    if (viewLocs.length) {
      // slice out all code not in views
      const outerSlice = (ls, start, end) => ls.slice(0, start).concat(ls.slice(end))

      const outside = viewLocs.reduce((src, loc) => outerSlice(src, loc[0][0], loc[1][0] + 1), src.split("\n")).join('')
      const prevOutside = State.outsideSources[file.path]
      changed = prevOutside !== outside
      State.outsideSources[file.path] = outside // update
    }

    if (opts('hasRunInitialBuild'))
      bridge.broadcast('file:outsideChange', { name: Cache.relative(file.path), changed })
  }

  function checkWriteable(file) {
    if (userStream || State.lastError) return false

    if (!opts('watching')) return true

    const isNew = (
      !State.lastSaved[file.path] ||
      file.startTime > State.lastSaved[file.path]
    )

    if (isNew) {
      State.lastSaved[file.path] = file.startTime
      return true
    }

    log.gulp('not writeable')
    return false
  }

  function hotReload(file) {
    // avoid
    if (!file.babel.isHot) return
    if (!hasFinished()) return
    if (file.babel.isInternal) return

    // run stuff after each change on build --watch
    doBuild()

    if (State.lastError) {
      log.gulp('State.lastError', State.lastError)
      return // avoid if error
    }

    // dont broadcast script if installing/bundling
    const isInstalling = bundler.isInstalling()

    if (isInstalling) {
      log.gulp('isInstalling', true)
      return
    }

    if (file.willInstall) {
      log.gulp('willInstall', true)
      Cache.setFileInstalling(file.relPath, true)
      return
    }

    // emit hot reload
    emitter.emit('script:end', { path: file.relPath })
    bridge.broadcast('script:add', file.message)
  }

  async function buildDone(file) {
    if (isSourceMap(file.path)) return

    if (file.finishingFirstBuild) {
      opts.set('hasRunInitialBuild', true)
      log.gulp('buildDone!!'.green.bold)
      waitingForFirstBuild.forEach(res => res())
    }
  }

  function doBuild() {
    if (opts('watch') && hasBuilt()) {
      builder.build()
      return true
    }
  }

  function markFileSuccess(file) {
    if (isSourceMap(file.path)) return

    out.goodScript(file)
    log.gulp('DOWN', 'success'.green, 'internal?', file.babel.isExported)

    // update cache error / state
    Cache.update(file.relPath)

    if (file.babel.isExported) return

    // write cache state to disk
    if (opts('hasRunInitialBuild')) serializeCache()

    // message browser of compile success
    bridge.broadcast('compile:success', file.message, 'error')

    // check if other errors left still in queue
    const error = Cache.getLastError()
    if (!error) return
    log.gulp('cache last error', error)
    bridge.broadcast('compile:error', { error }, 'error')
  }
}

let waitingForFirstBuild = []

export function afterBuild() {
  return new Promise((res, rej) => {
    if (hasFinished()) return res()
    else waitingForFirstBuild.push(res)
  })
}
