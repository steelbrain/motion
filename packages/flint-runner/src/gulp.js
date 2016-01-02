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

const LOG = 'gulp'
const $ = loadPlugins()
let OPTS

const serializeCache = _.throttle(cache.serialize, 200)
const hasFinished = () => opts.get('hasRunInitialBuild') && opts.get('hasRunInitialInstall')
const relative = file => path.relative(opts.get('appDir'), file.path)
const time = _ => typeof _ == 'number' ? ` - ${_}ms` : ''
const out = {
  badFile: (file, err) => console.log(` ◆ ${relative(file)}`.red),
  goodFile: (file, ms) => console.log(` ✓ ${relative(file)}`.bold) //${time(ms || (Date.now() - file.startTime) || 1)}
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
    blacklist: ['es6.tailCall', 'strict'],
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

        log(LOG, 'unlink', file)
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
    log(LOG, 'deleted', deletedPaths)

    buildScripts({ inFiles, outFiles })
  }
  catch(e) {
    handleError(e)
  }
}

// userStream is optional for programmatic usage
export function buildScripts({ inFiles, outFiles, userStream }) {
  const outDest = OPTS.build ? p(OPTS.buildDir, '_') : OPTS.outDir || '.'
  let curFile, lastError
  let lastSavedTimestamp = {}

  // track inFiles files to determine when it's loaded
  let loaded = 0
  let total = inFiles && inFiles.length || 0

  // gulp src stream
  const gulpSrcStream = gulp.src(SCRIPTS_GLOB)
    .pipe($.if(!OPTS.build, $.watch(SCRIPTS_GLOB, { readDelay: 1 })))

  // either user or gulp stream
  const sourceStream = userStream || gulpSrcStream
  const stream = OPTS.build ? sourceStream : merge(sourceStream, superStream.stream)

  log(LOG, 'starting stream')

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
        pipefn(removeNewlyInternal),
        pipefn(markFileSuccess), // before writing to preserve path
        gulp.dest(p(OPTS.depsDir, 'internal')),
        $.ignore.exclude(true)
      )
    ))
    .pipe($.if(!OPTS.build, $.sourcemaps.write('.')))
    .pipe($.if(isSourceMap, $.ignore.exclude(true)))
    .pipe($.if(OPTS.build,
      $.concat(`${OPTS.saneName}.js`)
    ))
    .pipe(pipefn(markFileSuccess))
    .pipe($.if(checkWriteable, gulp.dest(outDest)))
    .pipe(pipefn(afterWrite))
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())

  function markDone(file) {
    // mark built
    loaded += 1
    log(LOG, 'markDone', loaded, total, file.path)

    // check if done
    if (loaded == total)
      setTimeout(buildDone, 50)
  }

  // only do on first run
  function buildCheck(file) {
    // already done with first build
    if (opts.get('hasRunInitialBuild'))
      return false

    // hide behind cached flag for now
    if (!opts.get('cached')) {
      finish()
      return false
    }

    log(LOG, 'buildCheck', file.path)

    function finish() {
      log(LOG, 'buildCheck finish')
      cache.restorePrevious(file.path)

      // out.goodFile(file)

      markDone(file)
    }

    if (OPTS.build) {
      finish()
      return false
    }

    const outFile = path.join(OPTS.outDir, path.relative(OPTS.appDir, file.path))
    const prevFile = cache.getPrevious(file.path)

    // if exported file, mark done and skip
    if (prevFile && prevFile.isInternal) {
      finish()
      return false
    }

    let outMTime, srcMTime

    try {
      srcMTime = fs.statSync(file.path).mtime
    }
    catch(e) {
      log(LOG, 'buildCheck', 'src file removed')
      return false
    }

    try {
      outMTime = fs.statSync(outFile).mtime
    }
    catch(e) {
      log(LOG, 'buildCheck', 'out file removed')
      markDone(file)
      return false
    }

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
  }

  function resetLastFile(file) {
    lastError = false
    curFile = file
    file.startTime = Date.now()
    file.message = { startTime: file.startTime }
  }

  function catchError(error) {
    log(LOG, 'catchError', error)
    lastError = true
    out.badFile(curFile)

    error.timestamp = Date.now()

    // dont output massive stacks
    if (error.plugin == 'gulp-babel')
      error.stack = ''

    logError(error, curFile)

    cache.addError(error.fileName, error)
    bridge.message('compile:error', { error }, 'error')
  }

  function setLastFile(file) {
    if (OPTS.build) return
    let name = file.path.replace(OPTS.appDir, '')
    if (name.charAt(0) != '/') name = '/' + name
    log(LOG, 'setLastFile', 'path', file.path, 'name', name)

    // add to message
    file.message = {
      ...file.message,
      name: name,
      path: file.path,
      compiledAt: file.startTime
    }

    curFile = file
  }

  function isSourceMap(file) {
    return file.path.slice(file.path.length - 3, file.path.length) === 'map'
  }

  function checkWriteable(file) {
    if (OPTS.build) {
      builder.copy.styles()
    }

    if (userStream || lastError)
      return false

    // out.goodFile(file)

    if (OPTS.build)
      return true

    const isNew = (
      !lastSavedTimestamp[file.path] ||
      file.startTime > lastSavedTimestamp[file.path]
    )

    log(LOG, 'isNew', isNew)
    if (isNew) {
      lastSavedTimestamp[file.path] = file.startTime
      return true
    }

    return false
  }

  function afterWrite(file) {
    if (OPTS.build && OPTS.watch)
      return builder.build()

    log(LOG, 'afterWrite', 'hasFinished', hasFinished())
    if (hasFinished()) {
      const cacheHasFile = cache.get(file.path)
      log(LOG, 'afterWrite', 'lastError', lastError, 'file.isInternal', file.isInternal, 'cacheHasFile', cacheHasFile)
      if (!lastError && cacheHasFile) {
        bridge.message('script:add', file.message)
      }
    }
  }

  function markFileSuccess(file) {
    if (file.isSourceMap) return

    log(LOG, 'markLastFileSuccess', file.path)

    // log files as we startup
    out.goodFile(file)

    // update cache error / state
    cache.update(file.path)

    // write cache state to disk
    serializeCache()

    // message browser of compile success
    bridge.message('compile:success', file.message, 'error')

    // check if other errors left still in queue
    const error = cache.getLastError()
    if (!error) return
    log(LOG, 'cache last error', error)
    bridge.message('compile:error', { error }, 'error')
  }

  // ok so we start a file
  // its built into .flint/out
  // we then add an export
  // now we need to remove it from .flint/out
  function removeNewlyInternal(file) {
    // resolve path from .flint/.internal/deps/internals/xyz.js back to xyz.js
    const filePath = path.relative(p(opts.get('deps').dir, 'internal'), file.path)
    // then resolve path to .flint/.internal/out/xyz.js
    const outPath = p(opts.get('outDir'), filePath)
    log(LOG, 'remove newly internal', outPath)
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
