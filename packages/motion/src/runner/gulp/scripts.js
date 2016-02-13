import { $, gulp, SCRIPTS_GLOB, out, isBuilding, isSourceMap } from './lib/helpers'
import { superStream, dirAddStream } from './lib/streams'
import { _, fs, path, debounce, p, rm, logError, log } from '../lib/fns'
import unicodeToChar from '../lib/unicodeToChar'
import { event } from './index'
import { findBabelRuntimeRequires } from '../lib/findRequires'
import babel from './babel'
import bridge from '../bridge'
import cache from '../cache'
import builder from '../builder'
import bundler from '../bundler'
import scanner from './scanner'
import opts from '../opts'

const serializeCache = _.debounce(cache.serialize, 600)
const hasFinished = () => hasBuilt() && opts('hasRunInitialInstall')
const hasBuilt = () => opts('hasRunInitialBuild')
const getAllImports = (src, imports) => [].concat(findBabelRuntimeRequires(src), imports)
const scanNow = () => opts('build') || opts('watch') || !opts('hasRunInitialBuild')

export function scripts({ inFiles = [], userStream }) {
  let State = {
    curFile: null,
    lastError: null,
    lastSaved: {},
    loaded: 0,
    total: inFiles.length,
    outsideSources: {}
  }

  const scripts = userStream || gulp.src(SCRIPTS_GLOB)
    .pipe($.if(!isBuilding(), $.watch(SCRIPTS_GLOB, { readDelay: 1 })))
    .pipe($.if(file => file.event == 'unlink', $.ignore.exclude(true)))

  return (
    isBuilding() ?
    scripts :
    $.merge(scripts, dirAddStream(opts('appDir')), superStream.stream)
  )
      .pipe($.if(buildCheck, $.ignore.exclude(true)))
      .pipe($.log(reset))
      .pipe($.plumber(catchError))
      .pipe($.log(setLastFile))
      .pipe(scanner('pre'))
      .pipe($.sourcemaps.init())
      .pipe(babel.file())
      .pipe($.log(processDependencies))
      .pipe($.log(sendOutsideChanged)) // right after motion
      .pipe($.if(!userStream, $.rename({ extname: '.js' })))
      .pipe($.if(file => file.babel.isExported,
        $.multipipe(
          $.log(removeNewlyInternal),
          $.log(markFileSuccess), // before writing to preserve path
          gulp.dest(opts('deps').internalDir),
          $.log(bundle),
          $.log(buildDone),
          $.ignore.exclude(true)
        )
      ))
      .pipe($.log(markFileSuccess))
      .pipe($.sourcemaps.write('.'))
      .pipe($.if(checkWriteable, gulp.dest(opts('outDir'))))
      .pipe($.log(afterWrite))
      // temporary bugfix because gulp doesnt work well with watch (pending gulp 4)
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())
      .pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log()).pipe($.log())

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

    const prevFile = cache.getPrevious(file.path)
    if (!prevFile) return false

    let outMTime, srcMTime

    // read srcfile
    try { srcMTime = fs.statSync(file.path).mtime }
    catch(e) { return false }

    // read outfile
    try {
      const relPath = path.relative(opts('appDir'), file.path)
      const outFile = prevFile.babel.isExported
        ? path.join(opts('deps').dir, 'internal', relPath)
        : path.join(opts('outDir'), relPath)

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
        cache.restorePrevious(file.path)
        out.goodScript(file)
        afterWrite(file)
      }

      return restored
    }
  }

  function reset(file) {
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
    cache.addError(error.fileName || '', error)

    if (error.fileName)
      error.file = path.relative(opts('appDir'), error.fileName)

    bridge.broadcast('compile:error', { error }, 'error')

    markDone(State.curFile)
    buildDone(State.curFile)
  }

  function setLastFile(file) {
    if (isBuilding()) return
    let name = file.path.replace(opts('appDir'), '')
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

  // sets isInternal and willInstall
  // for handling npm and bundling related things
  function processDependencies(file) {
    cache.setFileInternal(file.path, file.babel.isExported)

    const scan = () => {
      cache.setFileImports(file.path, file.babel.imports)
      bundler.scanFile(file.path)
    }

    if (scanNow()) scan()
    else debounce(`install:${file.path}`, 2000, scan)

    if (!opts('build') || opts('watch')) {
      debounce('removeOldImports', 3000, bundler.uninstall)

      // check will install
      file.willInstall = bundler.willInstall(file.babel.imports)
    }
  }

  // detects if a file has changed not inside views for hot reloads correctness
  function sendOutsideChanged(file) {
    let src = file.contents.toString()
    let meta = cache.getFileMeta(file.path)

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
      bridge.broadcast('file:outsideChange', { name: cache.relative(file.path), changed })
  }

  function checkWriteable(file) {
    if (userStream || State.lastError) return false

    if (isBuilding()) return true

    const isNew = (
      !State.lastSaved[file.path] ||
      file.startTime > State.lastSaved[file.path]
    )

    if (isNew) {
      State.lastSaved[file.path] = file.startTime
      return true
    }

    return false
  }

  function afterWrite(file) {
    if (isSourceMap(file.path)) return

    buildDone(file)

    // avoid during initial build
    if (!hasFinished()) return
    if (file.babel.isExported) return

    // run stuff after each change on build --watch
    bundle()

    if (!cache.get(file.path)) return // avoid ?? todo: figure out why this is necessary
    if (State.lastError) return // avoid if error

    // dont broadcast script if installing/bundling
    log.gulp('bundler installing?', bundler.isInstalling(), 'willInstall?', file.willInstall)
    if (bundler.isInstalling() || file.willInstall) return

    // ADD
    bridge.broadcast('script:add', file.message)
  }

  function buildDone(file) {
    if (file.finishingFirstBuild) {
      opts.set('hasRunInitialBuild', true)
      log.gulp('buildDone!!'.green.bold)
      waitingForFirstBuild.forEach(res => res())
    }
  }

  function bundle() {
    if (opts('watch') && hasBuilt()) {
      builder.build({ bundle: false })
      return true
    }
  }

  function markFileSuccess(file) {
    if (isSourceMap(file.path)) return

    out.goodScript(file)
    log.gulp('DOWN', 'success'.green, 'internal?', file.babel.isExported)

    if (file.babel.isExported) return

    // update cache error / state
    cache.update(file.path)

    // write cache state to disk
    if (opts('hasRunInitialBuild')) serializeCache()

    // message browser of compile success
    bridge.broadcast('compile:success', file.message, 'error')

    // check if other errors left still in queue
    const error = cache.getLastError()
    if (!error) return
    log.gulp('cache last error', error)
    bridge.broadcast('compile:error', { error }, 'error')
  }

  // ok so we start a file
  // its built into .motion/out
  // we then add an export
  // now we need to remove it from .motion/out
  function removeNewlyInternal(file) {
    // resolve path from .motion/.internal/deps/internals/xyz.js back to xyz.js
    const filePath = path.relative(p(opts('deps').dir, 'internal'), file.path)
    // then resolve path to .motion/.internal/out/xyz.js
    const outPath = p(opts('outDir'), filePath)
    // log.gulp('remove newly internal', outPath)
    rm(outPath)
  }
}

let waitingForFirstBuild = []

export function afterBuild() {
  return new Promise((res, rej) => {
    if (hasFinished()) return res()
    else waitingForFirstBuild.push(res)
  })
}