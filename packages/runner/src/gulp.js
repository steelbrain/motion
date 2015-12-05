import chokidar from 'chokidar'
import merge from 'merge-stream'
import multipipe from 'multipipe'
import fs from 'fs'
import flintTransform from 'flint-transform'
import through from 'through2'
import path from 'path'
import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import bridge from './bridge'
import cache from './cache'
import copy from './builder/copy'
import build from './builder/build'
import logError from './lib/logError'
import superStream from './lib/superStream'
import compiler from './compiler'
import babel from './lib/gulp-babel'
import opts from './opts'
import writeStyle from './lib/writeStyle'
import onMeta from './lib/onMeta'
import { _, p, rm, handleError, log } from './lib/fns'

const $ = loadPlugins()
let lastSavedTimestamp = {}
let OPTS

const newLine = "\n"
const SCRIPTS_GLOB = [
  '[Mm]ain.js',
  '**/*.{js,jsf}',
  '!node_modules{,/**}',
  '!.flint{,/**}'
]

const serializeCache = _.throttle(cache.serialize, 200)
const hasFinished = () => {
  // console.log(opts.get('hasRunInitialBuild'), opts.get('hasRunInitialInstall'))
  return opts.get('hasRunInitialBuild') && opts.get('hasRunInitialInstall')
}
const relative = file => path.relative(opts.get('appDir'), file.path)
const time = _ => _ ? ` - ${_}ms` : ''
const out = {
  badFile: (file, err) => console.log(` ◆ ${relative(file)}`.red),
  goodFile: (file, ms) => console.log(` ✓ ${relative(file)}${time(ms)}`.bold)
}

gulp.task('build', buildScripts)

export function watchForBuild() {
  return gulp.watch(SCRIPTS_GLOB, ['build'])
}

const $p = {
  flint: {
    pre: () => compiler('pre'),
    post: () => compiler('post')
  },
  babel: () => babel({
    jsxPragma: 'view.el',
    stage: 2,
    blacklist: ['flow', 'es6.tailCall', 'strict'],
    retainLines: OPTS.pretty ? false : true,
    comments: true,
    optional: ['regenerator'],
    plugins: [flintTransform({
      log,
      basePath: OPTS.dir,
      production: OPTS.build,
      selectorPrefix: opts.get('config').selectorPrefix || '#_flintapp ',
      writeStyle,
      onMeta,
    })],
    extra: {
      production: process.env.production
    }
  })
}

// gulp doesnt send unlink events for files in deleted folders, so we do our own
function watchDeletes() {
  chokidar.watch('.', {ignored: /[\/\\]\./})
    .on('unlink', async (file) => {
      try {
        // ignore if in node_modules
        if (file.indexOf(opts.get('nodeDir')) === 0)
          return

        log('gulp', 'unlink', file)
        if (/jsf?/.test(path.extname(file))) {
          await rm(p(opts.get('outDir'), file))
          cache.remove(file)
        }
      }
      catch(e) {
        handleError(e)
      }
    })
}

// userStream is optional for programmatic usage
export function buildScripts({ userStream, previousOut }) {
  OPTS = opts.get()
  let lastScript, curFile, lastError
  let outDest = OPTS.build ? p(OPTS.buildDir, '_') : OPTS.outDir || '.'

  if (!opts.get('build')) {
    watchDeletes()
    superStream.init()
  }

  // gulp src stream
  const gulpSrcStream = gulp.src(SCRIPTS_GLOB)
    .pipe($.if(!OPTS.build, $.watch(SCRIPTS_GLOB, null, resetBuildWatch)))

  // either user or gulp stream
  const sourceStream = userStream || gulpSrcStream
  const stream = OPTS.build ? sourceStream : merge(sourceStream, superStream.stream)

  return stream
    .pipe($.if(buildSkip, $.ignore.exclude(true)))
    .pipe(pipefn(resetLastFile))
    .pipe($.plumber(catchError))
    .pipe(pipefn(setLastFile))
    .pipe($p.flint.pre())
    .pipe($.sourcemaps.init())
    .pipe($p.babel())
    .pipe($p.flint.post())
    .pipe($.if(!userStream, $.rename({ extname: '.js' })))
    .pipe($.if(file => file.isInternal,
      multipipe(
        gulp.dest(p(OPTS.depsDir, 'internal')),
        $.ignore.exclude(true)
      )
    ))
    .pipe($.if(!OPTS.build, $.sourcemaps.write('.')))
    .pipe($.if(OPTS.build,
      $.concat(`${OPTS.saneName}.js`)
    ))
    .pipe($.if(checkWriteable, gulp.dest(outDest)))
    .pipe(pipefn(afterWrite))
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())

  // previousOut == ['previous', 'out', 'files']

  function resetBuildWatch(vinyl) {
    if (!vinyl.event) buildFinishedCheck()
  }

  // only do on first run
  function buildSkip(file) {
    // stat.mtime
    const outFile = path.join(OPTS.outDir, path.relative(OPTS.appDir, file.path))
    try {
      const outMTime = fs.statSync(outFile).mtime
      const srcMTime = fs.statSync(file.path).mtime
      const goodBuild = +outMTime > +srcMTime

      if (!goodBuild)
        return false

      const cached = cache.getPrevious(file.path)

      if (!cached)
        return false

      const goodCache = cached.added > srcMTime

      if (!goodCache)
        return false

      cache.restorePrevious(file.path)
      out.goodFile(file)
      return true

    // catch if file doesnt exist
    } catch (e) { return false }
  }

  function resetLastFile(file) {
    lastError = false
    curFile = file
    lastScript = null
    file.startTime = Date.now()
  }

  function catchError(error) {
    log('gulp', 'catchError', error)
    lastError = true
    out.badFile(curFile)

    error.timestamp = Date.now()
    logError(error, curFile)
    cache.addError(error.fileName, error)
    bridge.message('compile:error', { error }, 'error')
    buildFinishedCheck()
  }

  function setLastFile(file) {
    if (OPTS.build) return
    let name = file.path.replace(OPTS.appDir, '')
    if (name.charAt(0) != '/') name = '/' + name
    log('gulp', 'setLastFile', 'path', file.path, 'name', name)
    lastScript = { name, compiledAt: file.startTime }
    curFile = file
  }

  function checkWriteable(file) {
    buildFinishedCheck()

    if (OPTS.build) {
      copy.styles()
    }

    file.isSourceMap = file.path.slice(file.path.length - 3, file.path.length) === 'map'

    if (file.isSourceMap)
      return true

    if (userStream || lastError)
      return false

    const endTime = Date.now() - file.startTime

    out.goodFile(file, endTime)
    log('build took ', endTime, 'ms')

    if (OPTS.build)
      return true

    const isNew = (
      !lastSavedTimestamp[file.path] ||
      file.startTime > lastSavedTimestamp[file.path]
    )

    log('gulp', 'isNew', isNew)
    if (isNew) {
      lastSavedTimestamp[file.path] = file.startTime
      return true
    }

    return false
  }

  function afterWrite(file) {
    if (OPTS.build && OPTS.watch)
      return build()

    if (file.isSourceMap) return

    log('gulp', 'afterWrite', 'hasFinished', hasFinished())
    if (hasFinished()) {
      const cacheHasFile = cache.get(file.path)
      log('gulp', 'afterWrite', 'lastError', lastError, 'file.isInternal', file.isInternal, 'cacheHasFile', cacheHasFile)
      if (!lastError && !file.isInternal && cacheHasFile) {
        cache.update(file.path)
        serializeCache()

        bridge.message('script:add', lastScript)
        bridge.message('compile:success', lastScript, 'error')

        // fixed one error but have others
        const error = cache.getLastError()
        if (error) bridge.message('compile:error', { error }, 'error')
      }
    }
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

let buildingTimeout
function buildFinishedCheck() {
  if (!opts.get('hasRunInitialBuild')) {
    if (buildingTimeout) clearTimeout(buildingTimeout)
    buildingTimeout = setTimeout(() => {
      opts.set('hasRunInitialBuild', true)
      runAfterFirstBuilds()
    }, 420)
  }
}

/* FIRST BUILD STUFF */

let waitingForFirstBuild = []

const afterFirstBuild = () =>
  new Promise((res, rej) => {
    if (hasFinished()) return res()
    else waitingForFirstBuild.push(res)
  })

const runAfterFirstBuilds = () =>
  waitingForFirstBuild.forEach(res => res())

/* END FIRST BUILD STUFF */


function pipefn(fn) {
  return through.obj(function(file, enc, next) {
    fn && fn(file)
    next(null, file);
  })
}

export default { buildScripts, afterFirstBuild, watchForBuild }
