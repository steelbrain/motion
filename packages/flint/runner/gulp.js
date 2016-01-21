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
let hasRunCurrentBuild = true
let buildingOnce = false

const serializeCache = _.throttle(cache.serialize, 200)
const isBuilding = () => buildingOnce || opts.get('build')
const hasBuilt = () => hasRunCurrentBuild && opts.get('hasRunInitialBuild')
const hasFinished = () => hasBuilt() && opts.get('hasRunInitialInstall')
const relative = file => path.relative(opts.get('appDir'), file.path)
const time = _ => typeof _ == 'number' ? ` ${_}ms` : ''
const out = {
  badFile: (file, err) => console.log(` ◆ ${relative(file)}`.red),
  goodFile: (file, ms) => console.log(
    // name
    ` ✓ ${relative(file)}`.bold
    // time
    + `${file.startTime ? time((Date.now() - file.startTime) || 1) : ''}`.dim
  )
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
    optional: ['regenerator', 'runtime'],
    plugins: [flintTransform({
      log,
      basePath: OPTS.dir,
      production: isBuilding(),
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
  chokidar.watch('.', {ignored: /[\/\\]\./}).on('unlink', handleDelete)

  async function handleDelete(file) {
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
  }
}

export async function init({ once = false } = {}) {
  try {
    OPTS = opts.get()

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

// used for production builds
export function bundleApp() {
  const buildDir = p(opts.get('buildDir'), '_')
  const appFile = p(buildDir, `${OPTS.saneName}.js`)
  const deps = opts.get('deps')

  return new Promise((resolve, reject) => {
    gulp.src([ deps.externalsOut, deps.internalsOut, appFile ])
      // sourcemap
      .pipe($.sourcemaps.init())
      // concat
      .pipe($.concat(`${OPTS.saneName}.prod.js`))
      // uglify
      .pipe($.if(() => !opts.get('nominify'), $.uglify()))
      .pipe($.sourcemaps.write('.'))
      .pipe(gulp.dest(buildDir))
      .on('end', resolve)
      .on('error', reject)
  })
}

// userStream is optional for programmatic usage
export function buildScripts({ inFiles, outFiles, userStream }) {
  const outDest = () => isBuilding() ? p(OPTS.buildDir, '_') : OPTS.outDir || '.'
  let curFile, lastError
  let lastSavedTimestamp = {}

  // track inFiles files to determine when it's loaded
  let loaded = 0
  let total = inFiles && inFiles.length || 0

  // gulp src stream
  const gulpSrcStream = gulp.src(SCRIPTS_GLOB)
    .pipe($.if(!isBuilding(), $.watch(SCRIPTS_GLOB, { readDelay: 1 })))
    // ignore unlinks in pipeline
    .pipe($.if(file => file.event == 'unlink', $.ignore.exclude(true)))


  // either user or gulp stream
  const sourceStream = userStream || gulpSrcStream
  const stream = isBuilding() ? sourceStream : merge(sourceStream, superStream.stream)

  const name = OPTS.saneName
  const wrapFnName = `flintRun_${name}`
  const wrapTemplate = `
window.${wrapFnName} = function ${wrapFnName}(node, opts, cb) {
  var FlintInstace = opts.Flint || runFlint;
  var Flint = FlintInstace(node, opts, cb);

  (function(Flint) {
    <%= contents %>

    ;Flint.init()
  })(Flint);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${wrapFnName}
}`


  return stream
    .pipe($.if(buildCheck, $.ignore.exclude(true)))
    .pipe(pipefn(resetLastFile))
    .pipe($.plumber(catchError))
    .pipe(pipefn(setLastFile))
    .pipe($p.flint.pre())
    .pipe($.wrap((data, ...args) => {
      const location = cache.name(data.file.path)
      const contents = data.contents.toString('utf8')

      // preserve line numbers
      return `!function(){ Flint.file('${location}',function(require, exports){ ${contents}
  })
}();`
    }))
    .pipe($.if(isBuilding,
      multipipe(
        $.concat(`${name}.js`),
        $.wrap(wrapTemplate)
      )
    ))
    .pipe($.sourcemaps.init())
    .pipe($p.babel())
    .pipe($p.flint.post())
    .pipe($.if(!userStream, $.rename({ extname: '.js' })))
    // is internal
    .pipe($.if(file => file.isInternal,
      multipipe(
        pipefn(removeNewlyInternal),
        pipefn(markFileSuccess), // before writing to preserve path
        gulp.dest(p(OPTS.depsDir, 'internal')),
        $.ignore.exclude(true)
      )
    ))
    // not sourcemap
    .pipe($.if(file => !isSourceMap(file),
      multipipe(
        pipefn(out.goodFile),
        pipefn(markFileSuccess)
      )
    ))
    .pipe($.sourcemaps.write('.'))
    .pipe($.if(checkWriteable, gulp.dest(outDest)))
    .pipe(pipefn(afterWrite))
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())

  function markDone(file) {
    // mark built
    loaded += 1
    log(LOG, 'markDone', loaded, total, file.path)

    // check if done
    if (loaded == total) {
      // add some delay to allow building last file TODO improve
      setTimeout(buildDone, 100)
    }
  }

  // only do on first run
  function buildCheck(file) {
    // BUGFIX gulp sends deleted files through here, this filters them
    if (!file.contents)
      return true

    // already done with first build
    if (hasBuilt())
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

      markDone(file)
    }

    if (isBuilding()) {
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
    if (isBuilding()) return
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
    return path.extname(file.path) === '.map'
  }

  function checkWriteable(file) {
    if (isBuilding()) {
      builder.copy.styles()
    }

    if (userStream || lastError)
      return false

    if (isBuilding())
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
    if (isBuilding() && OPTS.watch) {
      builder.build()
      return
    }

    // avoid during initial build
    if (!hasFinished()) return

    // avoid ?? todo: figure out why this is necessary
    if (!cache.get(file.path)) return

    // avoid if error
    if (lastError) return

    // avoid if installing
    if (bundler.isInstalling()) return

    // ADD
    bridge.message('script:add', file.message)
  }

  function markFileSuccess(file) {
    if (file.isSourceMap) return

    log(LOG, 'markFileSuccess', file.path)

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
function afterBuild() {
  return new Promise((res, rej) => {
    if (hasFinished()) return res()
    else waitingForFirstBuild.push(res)
  })
}

function buildDone() {
  // remove old files from out dir
  opts.set('hasRunInitialBuild', true)
  hasRunCurrentBuild = true
  buildingOnce = false
  waitingForFirstBuild.forEach(res => res())
}


function pipefn(fn) {
  return through.obj(function(file, enc, next) {
    fn && fn(file)
    next(null, file);
  })
}

export default { init, buildScripts, bundleApp, afterBuild, watchForBuild }