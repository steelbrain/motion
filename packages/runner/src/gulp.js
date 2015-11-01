import multipipe from 'multipipe'
import flintTransform from 'flint-transform'
import through from 'through2'
import path from 'path'
import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
const $ = loadPlugins()

import bridge from './bridge'
import cache from './cache'
import unicodeToChar from './lib/unicodeToChar'
import compiler from './compiler'
import babel from './lib/gulp-babel'
import opts from './opts'
import log from './lib/log'
import { p, rmdir } from './lib/fns'

let lastSavedTimestamp = {}
let OPTS

const newLine = "\n"
const SCRIPTS_GLOB = [
  '[Mm]ain.js', '**/*.{js,jsf}',
  '!node_modules{,/**}',
  '!.flint{,/**}'
]

gulp.task('build', buildScripts)

export function watchForBuild() {
  return gulp.watch(SCRIPTS_GLOB, ['build'])
}

/* FIRST BUILD STUFF */

let waitingForFirstBuild = []

const afterFirstBuild = () =>
  new Promise((res, rej) => {
    if (OPTS.hasRunInitialBuild) return res()
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

const watchDeletes = async vinyl => {
  try {
    if (vinyl.event == 'unlink') {
      cache.remove(vinyl.path)
      const name = path.relative(OPTS.outDir, vinyl.path)
      await rmdir(p(OPTS.outDir, name))
      bridge.message('file:delete', { name })
    }
  }
  catch(e) { handleError(e) }
}

const relative = file => path.relative(OPTS.appDir, file.path)
let isWriting = false
const startWrite = cb => { if (isWriting) return; isWriting = true; cb() }
const endWrite = cb => { isWriting = false; cb() }
const out = {
  file: file => startWrite(() => process.stdout.write(` ⇢ ${relative(file)}\r`)),
  badFile: (file, err) => endWrite(() => console.log(` ◆ ${relative(file)}`.red)),
  goodFile: (file, ms) => endWrite(() => console.log(` ✓ ${relative(file)} - ${ms}ms`.bold))
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
    retainLines: true,
    comments: true,
    optional: ['bluebirdCoroutines'],
    plugins: [flintTransform({ basePath: OPTS.dir })],
    extra: {
      production: process.env.production
    }
  }),
  buildWrap: () => multipipe(
    $.concat(`${OPTS.name}.js`),
    $.wrap(
      { src: `${__dirname}/../../templates/build.template.js` },
      { name: OPTS.name },
      { variable: 'data' }
    )
  )
}

export function buildScripts(cb, stream) {
  OPTS = opts.get()

  console.log('Building...'.bold.white)
  log('build scripts')
  let startTime, lastScript, curFile, lastError
  let outDest = OPTS.build ? p(OPTS.buildDir, '_') : OPTS.outDir || '.'
  let internalDest = p(OPTS.flintDir, 'deps', 'internal')

  return (stream || gulp.src(SCRIPTS_GLOB))
    .pipe($.if(!OPTS.build, $.watch(SCRIPTS_GLOB, null, watchDeletes)))
    .pipe(pipefn(resetLastFile))
    .pipe($.plumber(catchError))
    .pipe(pipefn(setLastFile))
    .pipe($p.flint.pre())
    .pipe($.sourcemaps.init())
    .pipe($p.babel())
    .pipe($p.flint.post())
    .pipe($.if(!stream, $.rename({ extname: '.js' })))
    .pipe(pipefn(() => {
      // for spaces when outputting
      if (OPTS.build) console.log()
    }))
    .pipe($.if(file => !OPTS.build && !file.isInternal, $.sourcemaps.write('.')))
    .pipe($.if(OPTS.build, $p.buildWrap()))
    .pipe($.if(file => file.isInternal,
      multipipe(
        gulp.dest(internalDest),
        $.ignore.exclude(true)
      )
    ))
    .pipe($.if(checkWriteable, gulp.dest(outDest)))
    .pipe(pipefn(afterWrite))
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())

  function resetLastFile(file) {
    // reset
    curFile = file
    lastError = false
    lastScript = null
    // time build
    startTime = Date.now()
    file.startTime = startTime
    // log
    out.file(file)
  }

  function catchError(error) {
    lastError = true
    // add time
    error.timestamp = Date.now()
    // log
    out.badFile(curFile)
    logError(error, curFile)
    // send bridge
    cache.addError(error.fileName, error)
    bridge.message('compile:error', { error })
    // reset finished check
    buildFinishedCheck(lastScript)
  }

  function setLastFile(file) {
    if (OPTS.build) return
    let name = file.path.replace(OPTS.appDir, '')
    lastScript = { name, compiledAt: startTime }
    curFile = file
  }

  function checkWriteable(file) {
    if (file.isInternal)
      return false

    file.isSourceMap = file.path.slice(file.path.length - 3, file.path.length) === 'map'

    buildFinishedCheck(lastScript)

    if (file.isSourceMap)
      return true

    if (stream || lastError)
      return false

    const endTime = Date.now() - startTime

    out.goodFile(file, endTime)
    log('build took ', endTime, 'ms')

    const isNew = (
      !lastSavedTimestamp[file.path] ||
      file.startTime > lastSavedTimestamp[file.path]
    )

    log('is new file', isNew)
    if (isNew) {
      lastSavedTimestamp[file.path] = file.startTime
      return true
    }

    return false
  }

  function afterWrite(file) {
    if (file.isSourceMap) return

    log('OPTS.hasRunInitialBuild', OPTS.hasRunInitialBuild)
    log('lastError', lastError)

    // after initial build
    if (OPTS.hasRunInitialBuild) {
      if (!lastError && !file.isInternal) {
        cache.removeError(file.path)
        bridge.message('script:add', lastScript)
        bridge.message('compile:success', lastScript)

        // fixed one error but have others
        const prevError = cache.getLastError()
        if (prevError)
          bridge.message('compile:error', { error: prevError })
      }
    }
  }
}

export function buildWhileRunning() {
  console.log("Building...")
  return new Promise((res, rej) => {
    gulp.src(['.flint/out/**/*.js'])
      .pipe($.plumber(err => {
        logError(err)
        rej(err)
      }))
      .pipe($p.buildWrap())
      .pipe(gulp.dest(p(OPTS.buildDir, '_')))
      .pipe(pipefn(res))
  });
}

let buildingTimeout
function buildFinishedCheck(lastScript) {
  if (!OPTS.hasRunInitialBuild) {
    log('buildFinishedCheck setTimeout')
    if (buildingTimeout) clearTimeout(buildingTimeout)
    buildingTimeout = setTimeout(() => {
      log('OPTS.hasRunInitialBuild = true')
      OPTS.hasRunInitialBuild = true

      runAfterFirstBuilds()
    }, 450)
  }
}

function logError(error, file) {
  if (error.stack || error.codeFrame)
    error.stack = unicodeToChar(error.stack || error.codeFrame);

  if (error.plugin == 'gulp-babel') {
    console.log(error.message.replace(OPTS.appDir, ''));
    if (error.name != 'TypeError' && error.loc)
      console.log('line: %s, col: %s', error.loc.line, error.loc.column);
    console.log(newLine, error.stack.split("\n").splice(0, 7).join("\n"))
  }
  else {
    console.log('ERROR', "\n", error)
    console.log(error.stack)
    log('FILE', "\n", file.contents.toString())
  }
}

export default { buildScripts, afterFirstBuild, watchForBuild }