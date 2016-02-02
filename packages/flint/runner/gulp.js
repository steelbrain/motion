import chokidar from 'chokidar'
import merge from 'merge-stream'
import multipipe from 'multipipe'
import flintTransform from 'flint-transform'
import through from 'through2'
import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import bridge from './bridge'
import cache from './cache'
import builder from './builder'
import bundler from './bundler'
import superStream from './lib/superStream'
import dirAddStream from './lib/dirAddStream'
import compiler from './compiler'
import babel from './lib/gulp-babel'
import opts from './opts'
import writeStyle from './lib/writeStyle'
import onMeta from './lib/onMeta'
import chalk from 'chalk'
import { findBabelRuntimeRequires } from './lib/findRequires'
import SCRIPTS_GLOB from './const/scriptsGlob'
import { _, fs, path, glob, readdir, p, rm, mkdir, handleError, logError, log } from './lib/fns'
import {getBabelConfig, isProduction} from './helpers'

const debug = log.gulp

const $ = loadPlugins()

let OPTS
let hasRunCurrentBuild = true
let buildingOnce = false

const serializeCache = _.throttle(cache.serialize, 200)
const isSourceMap = file => path.extname(file) === '.map'
const isBuilding = () => buildingOnce || (opts('build') && !opts('watch'))
const hasBuilt = () => hasRunCurrentBuild && opts('hasRunInitialBuild')
const hasFinished = () => hasBuilt() && opts('hasRunInitialInstall')
const relative = file => path.relative(opts('appDir'), file.path)
const time = _ => typeof _ == 'number' ? ` ${_}ms` : ''
let out = {}
out.badFile = (file, err) => console.log(`  ✖ ${relative(file)}`.red),
out.goodFile = symbol => (file, ms) => console.log(
    `  ${chalk.dim(symbol)} ${chalk.bold(relative(file))} `
    + chalk.dim(file.startTime ? time((Date.now() - file.startTime) || 1).dim : '')
)
out.goodScript = out.goodFile('-')

// TODO bad practice
let fileImports = {}

const $p = {
  flint: {
    pre: () => compiler('pre'),
    post: () => compiler('post')
  },

  flintFile: () => babel(getBabelConfig({
    log,
    writeStyle: writeStyle.write,
    onMeta,
    onImports(file, imports) {
      fileImports[file] = imports
    },
    onExports(file, val) {
      cache.setFileInternal(file, val)
    }
  }))
}

// gulp doesnt send unlink events for files in deleted folders, so we do our own
function watchDeletes() {
  chokidar.watch('.', {ignored: /[\/\\]\./}).on('unlink', handleDelete)

  async function handleDelete(file) {
    try {
      // ignore if in node_modules
      if (file.indexOf('.flint') === 0) return

      debug('unlink', file)
      if (/jsf?/.test(path.extname(file))) {
        await rm(p(opts('outDir'), file))
        cache.remove(file)
      }
    }
    catch(e) { handleError(e) }
  }
}

export async function init({ once = false } = {}) {
  try {
    OPTS = opts()

    writeStyle.init()
    buildingOnce = once

    // if manually running a once
    if (once) {
      hasRunCurrentBuild = false
    }

    if (!isBuilding()) {
      watchDeletes()
      superStream.init()
    }

    const inFiles = await glob(SCRIPTS_GLOB)
    const _outFiles = await readdir(OPTS.outDir)
    const outFiles = _outFiles
      .map(file => file.path)
      .filter(path => path.slice(-4) !== '.map')

    // cleanup out dir since last run
    const deleted = _.difference(outFiles, inFiles)
    const deletedPaths = deleted.map(f => p(opts('outDir'), f))
    await* deletedPaths.map(f => rm(f))
    debug('deleted', deletedPaths)

    buildScripts({ inFiles, outFiles })
  }
  catch(e) {
    handleError(e)
  }
}

// ||
// ||  ASSETS
// ||

export async function assets() {
  try {
    await* [
      assetsApp(),
      assetsStatics()
    ]
  }
  catch(e) {
    handleError(e)
  }
}

// app images, fonts, etc
function assetsApp() {
  const assets = {
    glob: ['*', '**/*', '!**/*.js', , '!**/*.js.map', '!.flint{,/**}' ],
    out: opts('buildDir')
  }

  let stream = gulp.src(assets.glob)

  if (opts('watch'))
    stream = stream.pipe($.watch(assets.glob, { readDelay: 1 }))

  return new Promise((resolve, reject) => {
    stream
        .pipe($.plumber())
        // .pipe(pipefn(out.goodFile('⇢')))
        .pipe(gulp.dest(assets.out))
        .on('end', resolve)
        .on('error', reject)
  })
}

// .flint/static
async function assetsStatics() {
  const statics = {
    dir: p(opts('flintDir'), 'static'),
    glob: ['*', '**/*', '!.flint{,/**}'],
    out: p(opts('buildDir'), '_', 'static')
  }

  await mkdir(statics.out)

  let stream = gulp.src(statics.glob, { cwd: statics.dir })

  if (opts('watch'))
    stream = stream.pipe($.watch(statics.glob, { readDelay: 1 }))

  return new Promise((resolve, reject) => {
    stream
        .pipe($.plumber())
        // .pipe(pipefn(out.goodFile('⇢')))
        .pipe(gulp.dest(statics.out))
        .on('end', resolve)
        .on('error', reject)
  })
}


// ||
// ||  BUILD
// ||

// used for build
export async function bundleApp() {
  try {
    const dest = p(opts('buildDir'), '_')
    const deps = opts('deps')
    const minify = !opts('nomin')

    let appFiles = await readdir(OPTS.outDir)
    appFiles = appFiles.map(f => f.fullPath).filter(x => !isSourceMap(x)).sort()

    if (minify)
      console.log(`\n  Minifying...`.dim)

    // build parallel
    await* [
      buildForDeploy(deps.internalsOut, { dest, minify }),
      buildForDeploy(deps.externalsOut, { dest, minify }),
      buildForDeploy(appFiles, { dest, minify, combine: true, wrap: true })
    ]
  }
  catch(e) {
    handleError(e)
  }
}

function buildForDeploy(src, { dest, combine, minify, wrap }) {
  return new Promise((resolve, reject) => {
    gulp.src(src)
      .pipe($.sourcemaps.init())
      // .pipe($.if(combine, $.order(src)))
      .pipe($.if(combine, $.concat(`${opts('saneName')}.js`)))
      .pipe($.if(wrap,
        babel({
          whitelist: [],
          retainLines: true,
          comments: true,
          plugins: [flintTransform.app({ name: opts('saneName') })],
          compact: true,
          extra: { production: isProduction() }
        })
      ))
      .pipe($.if(minify, $.uglify()))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(dest))
      .on('end', resolve)
      .on('error', reject)
  })
}

// listen to gulp events
let listeners = {}
event.run = (name, file, data) => listeners[name] && listeners[name].forEach(cb => cb(file, data))
export function event(name, cb) {
  listeners[name] = listeners[name] || []
  listeners[name].push(cb)
}



// ||
// ||  RUN / BUILD WATCH
// ||

export function buildScripts({ inFiles, outFiles, userStream }) {
  let State = {
    curFile: null,
    lastError: null,
    lastSaved: {},
    loaded: 0,
    total: inFiles && inFiles.length || 0
  }

  let scripts = userStream || gulp.src(SCRIPTS_GLOB)
    .pipe($.if(!isBuilding(), $.watch(SCRIPTS_GLOB, { readDelay: 1 })))
    .pipe($.if(file => file.event == 'unlink', $.ignore.exclude(true)))

  return (isBuilding() ?
    scripts :
    merge(scripts, dirAddStream(opts('appDir')), superStream.stream)
  )
      .pipe($.if(buildCheck, $.ignore.exclude(true)))
      .pipe(pipefn(resetLastFile))
      .pipe($.plumber(catchError))
      .pipe(pipefn(setLastFile))
      .pipe($p.flint.pre())
      .pipe($.sourcemaps.init())
      .pipe($p.flintFile())
      .pipe(pipefn(updateCache)) // right after babel
      .pipe($p.flint.post())
      .pipe($.if(!userStream, $.rename({ extname: '.js' })))
      // is internal
      .pipe($.if(file => file.isInternal,
        multipipe(
          pipefn(removeNewlyInternal),
          pipefn(markFileSuccess), // before writing to preserve path
          gulp.dest(p(OPTS.depsDir, 'internal')),
          pipefn(bundle),
          pipefn(buildDone),
          $.ignore.exclude(true)
        )
      ))
      .pipe(pipefn(markFileSuccess))
      .pipe($.sourcemaps.write('.'))
      .pipe($.if(checkWriteable, gulp.dest(OPTS.outDir)))
      .pipe(pipefn(afterWrite))
      .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())


  function markDone(file) {
    // mark built
    State.loaded += 1

    const done = State.loaded == State.total

    debug('markDone', State.total, '/', State.loaded, done)

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
      const relPath = path.relative(OPTS.appDir, file.path)
      const outFile = prevFile.isInternal
        ? path.join(OPTS.deps.dir, 'internal', relPath)
        : path.join(OPTS.outDir, relPath)

      outMTime = fs.statSync(outFile).mtime
    }
    catch(e) {
      debug('buildCheck', 'out file removed')
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

  function resetLastFile(file) {
    fileImports[file] = false
    State.lastError = false
    State.curFile = file
    file.startTime = Date.now()
    file.message = { startTime: file.startTime }
  }

  function catchError(error) {
    debug('catchError', error)
    State.lastError = true
    out.badFile(State.curFile)

    error.timestamp = Date.now()

    logError(error, State.curFile)

    event.run('error', State.curFile, error)
    cache.addError(error.fileName || '', error)
    bridge.broadcast('compile:error', { error }, 'error')

    markDone(State.curFile)
    buildDone(State.curFile)
  }

  function setLastFile(file) {
    if (isBuilding()) return
    let name = file.path.replace(OPTS.appDir, '')
    if (name.charAt(0) != '/') name = '/' + name
    debug(name)

    // add to message
    file.message = {
      ...file.message,
      name: name,
      path: file.path,
      compiledAt: file.startTime
    }

    State.curFile = file
  }

  // update cache: meta/src/imports
  function updateCache(file) {
    file.src = file.contents.toString()

    //  babel externals, set imports for willInstall detection
    let babelExternals = findBabelRuntimeRequires(file.contents.toString())
    let imports = fileImports[file.path]
    let all = [].concat(babelExternals, imports)
    cache.setFileImports(file.path, all)

    // meta
    let meta = cache.getFileMeta(file.path)
    // outside changed detection
    sendOutsideChanged(meta, file)
  }

  // detects if a file has changed not inside views for hot reloads correctness
  function sendOutsideChanged(meta, file) {
    if (!meta) return

    let changed = false
    const viewLocs = Object.keys(meta).map(view => meta[view].location)

    if (viewLocs.length) {
      // slice out all code not in views
      const outerSlice = (ls, start, end) => ls.slice(0, start).concat(ls.slice(end))

      const outsideSrc = viewLocs.reduce((src, loc) => outerSlice(src, loc[0][0], loc[1][0] + 1), file.src.split("\n")).join('')
      const cacheFile = cache.getFile(file.path)
      const prevOutsideSrc = cacheFile.outsideSrc
      cacheFile.outsideSrc = outsideSrc // update
      changed = prevOutsideSrc !== outsideSrc
    }

    if (opts('hasRunInitialBuild'))
      bridge.broadcast('file:outsideChange', { name: cache.relative(file.path), changed })
  }

  function checkWriteable(file) {
    if (userStream || State.lastError)
      return false

    if (isBuilding())
      return true

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

    if (file.isInternal) return

    // run stuff after each change on build --watch
    bundle()

    // avoid ?? todo: figure out why this is necessary
    if (!cache.get(file.path)) return

    // avoid if error
    if (State.lastError) return

    // avoid if installing
    if (bundler.isInstalling() || file.willInstall) return

    // ADD
    bridge.broadcast('script:add', file.message)
  }

  function buildDone(file) {
    if (file.finishingFirstBuild) {
      opts.set('hasRunInitialBuild', true)
      hasRunCurrentBuild = true
      buildingOnce = false
      debug('buildDone!!'.green.bold)
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

    debug('DOWN', 'success'.green, 'internal?', file.isInternal, 'install?', file.willInstall)

    if (file.isInternal) return

    // update cache error / state
    cache.update(file.path)

    // write cache state to disk
    if (opts('hasRunInitialBuild'))
      serializeCache()

    // message browser of compile success
    bridge.broadcast('compile:success', file.message, 'error')

    // check if other errors left still in queue
    const error = cache.getLastError()
    if (!error) return
    debug('cache last error', error)
    bridge.broadcast('compile:error', { error }, 'error')
  }

  // ok so we start a file
  // its built into .flint/out
  // we then add an export
  // now we need to remove it from .flint/out
  function removeNewlyInternal(file) {
    // resolve path from .flint/.internal/deps/internals/xyz.js back to xyz.js
    const filePath = path.relative(p(opts('deps').dir, 'internal'), file.path)
    // then resolve path to .flint/.internal/out/xyz.js
    const outPath = p(opts('outDir'), filePath)
    // debug('remove newly internal', outPath)
    rm(outPath)
  }
}

export function buildWhileRunning() {
  return new Promise((res, rej) => {
    gulp.src(['.flint/.internal/out/**/*.js'])
      .pipe($.plumber(err => {
        logError(err)
        rej(err)
      }))
      .pipe($.concat(`${OPTS.saneName}.js`))
      .pipe(gulp.dest(p(OPTS.buildDir, '_')))
      .pipe(pipefn(res))
  });
}

let waitingForFirstBuild = []
function afterBuild() {
  return new Promise((res, rej) => {
    if (hasFinished()) return res()
    else waitingForFirstBuild.push(res)
  })
}

function pipefn(fn) {
  return through.obj(function(file, enc, next) {
    let result = fn && fn(file)

    if (typeof result == 'string') {
      file.contents = new Buffer(result)
      next(null, file)
      return
    }

    next(null, file)
  })
}

export default { init, buildScripts, bundleApp, afterBuild, event, assets }