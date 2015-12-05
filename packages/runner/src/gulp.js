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
import superStream from './lib/superStream'
import compiler from './compiler'
import babel from './lib/gulp-babel'
import opts from './opts'
import writeStyle from './lib/writeStyle'
import onMeta from './lib/onMeta'
import SCRIPTS_GLOB from './const/scriptsGlob'
import { _, fs, path, glob, readdir, p, rm, handleError, logError, log } from './lib/fns'

const $ = loadPlugins()
let OPTS

const serializeCache = _.throttle(cache.serialize, 200)
const hasFinished = () => opts.get('hasRunInitialBuild') && opts.get('hasRunInitialInstall')
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
        if (file.indexOf('.flint') === 0)
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

export async function init() {
  try {
    OPTS = opts.get()

    if (!opts.get('build')) {
      watchDeletes()
      superStream.init()
    }

    const inFiles = await glob(SCRIPTS_GLOB)
    const _outFiles = await readdir({ root: OPTS.outDir })
    const outFiles = _outFiles.files
      .map(file => file.path)
      .filter(path => path.slice(-4) !== '.map')

    // cleanup out dir since last run
    const deleted = _.difference(outFiles, inFiles)
    const deletedPaths = deleted.map(f => p(opts.get('outDir'), f))
    await* deletedPaths.map(f => rm(f))

    buildScripts({ inFiles, outFiles })
  }
  catch(e) {
    handleError(e)
  }
}

// userStream is optional for programmatic usage
export function buildScripts({ inFiles, outFiles, userStream }) {
  const outDest = OPTS.build ? p(OPTS.buildDir, '_') : OPTS.outDir || '.'
  let lastScript, curFile, lastError
  let lastSavedTimestamp = {}

  // track inFiles files to determine when it's loaded
  let loaded = 0
  let total = inFiles.length

  // gulp src stream
  const gulpSrcStream = gulp.src(SCRIPTS_GLOB)
    .pipe($.if(!OPTS.build, $.watch(SCRIPTS_GLOB, { readDelay: 1 })))

  // either user or gulp stream
  const sourceStream = userStream || gulpSrcStream
  const stream = OPTS.build ? sourceStream : merge(sourceStream, superStream.stream)

  return stream
    .pipe($.if(buildCheck, $.ignore.exclude(true)))
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

  function markDone(file) {
    // mark built
    loaded++

    // check if done
    if (loaded == total)
      buildDone()
  }

  // only do on first run
  function buildCheck(file) {
    if (OPTS.build) {
      finish()
      return false
    }

    const outFile = path.join(OPTS.outDir, path.relative(OPTS.appDir, file.path))

    try {
      function finish() {
        cache.restorePrevious(file.path)
        out.goodFile(file)
        markDone(file)
      }

      // if exported file, mark done and skip
      if (cache.getPrevious(file.path).isExported) {
        finish()
        return false
      }

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

      finish()
      return true

    // catch if file doesnt exist
    } catch (e) {
      return false
    }
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
    if (OPTS.build) {
      builder.copy.styles()
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
    if (file.isSourceMap) return

    markDone(file)

    if (OPTS.build && OPTS.watch)
      return builder.build()

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


let waitingForFirstBuild = []
function afterFirstBuild() {
  return new Promise((res, rej) => {
    if (hasFinished()) return res()
    else waitingForFirstBuild.push(res)
  })
}

function buildDone() {
  // remove old files from out dir
  opts.set('hasRunInitialBuild', true)
  waitingForFirstBuild.forEach(res => res())
}


function pipefn(fn) {
  return through.obj(function(file, enc, next) {
    fn && fn(file)
    next(null, file);
  })
}

export default { init, buildScripts, afterFirstBuild, watchForBuild }
