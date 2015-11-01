import compiler from './compiler'
import babel from './lib/gulp-babel'
import bridge from './bridge'
import handleError from './lib/handleError'
import build from './fbuild'
import server from './server'
import npm from './npm'
import opts from './opts'
import log from './lib/log'
import cache from './cache'
import unicodeToChar from './lib/unicodeToChar'
import openInBrowser from './lib/openInBrowser'
import wport from './lib/wport'
import clear from './fbuild/clear'
import keys from './keys'
import { p, rmdir, readdir, readJSON, writeJSON, readFile } from './lib/fns'

import flintTransform from 'flint-transform'
import { Promise } from 'bluebird'
import multipipe from 'multipipe'
import path from 'path'

import hostile from 'hostile'
import through from 'through2'
import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
const $ = loadPlugins()

Promise.longStackTraces()

const newLine = "\n"
const SCRIPTS_GLOB = [
  '[Mm]ain.js', '**/*.{js,jsf}',
  '!node_modules{,/**}',
  '!.flint{,/**}'
]

let lastSavedTimestamp = {}
let OPTS, CONFIG

gulp.task('build', buildScripts)

// prompts for domain they want to use
const firstRun = () =>
  new Promise(async (res, rej) => {
    try {
      CONFIG = await readJSON(OPTS.configFile)
      OPTS.config = CONFIG
      log('got config', CONFIG)
    }
    catch(e) {}

    const hasRunBefore = OPTS.build || CONFIG
    log('first run hasRunBefore:', hasRunBefore)

    if (hasRunBefore)
      return res(false)

    askForUrlPreference(useFriendly => {
      CONFIG = { friendlyUrl: OPTS.url, useFriendly: useFriendly }
      OPTS.config = CONFIG
      writeConfig(CONFIG)
      res(true)
    })
  })

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

const userEditor = (process.env.VISUAL || process.env.EDITOR)

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

let writeWPort = socketPort =>
  readConfig().then(config =>
    writeConfig(Object.assign(config, { socketPort }))
  )

export function buildScripts(cb, stream) {
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

let readConfig = () => readJSON(OPTS.configFile)

function writeConfig(config) {
  writeJSON(OPTS.configFile, config, { spaces: 2 })
}

function watchingMessage() {
  keys.start()
  console.log(
    newLine +
    ' • O'.cyan.bold + 'pen        '.cyan +
      ' • V'.cyan.bold + 'erbose'.cyan + newLine +
    (userEditor
      ? (' • E'.cyan.bold + 'dit        '.cyan)
      : '               ') +
        ' • I'.cyan.bold + 'nstall (npm)'.cyan + newLine
    // ' • U'.blue.bold + 'pload'.blue + newLine
  )
  keys.resume()
}

// ask for preferred url and set /etc/hosts
function askForUrlPreference(cb) {
  // var promptly = require('promptly');
  var askCounter = 'Run on ' + OPTS.url + '?';

  // promptly.prompt(askCounter, {}, function(err, val) {
    var useFriendly = false; // val == 'y';
    if (useFriendly) hostile.set('127.0.0.1', OPTS.url)
    cb(useFriendly)
  // });
}

function setLogging(opts) {
  log.debug = opts.debug || opts.verbose
}

export async function run(_opts, isBuild) {
  try {
    const appDir = path.normalize(process.cwd());
    OPTS = opts.set({ ..._opts, appDir, isBuild })

    setLogging(OPTS)
    log('run', OPTS)

    npm.init(OPTS)
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)

    await firstRun()

    if (OPTS.build) {
      console.log(
        "\nBuilding %s to %s\n".bold.white,
        OPTS.name + '.js',
        path.normalize(OPTS.buildDir)
      )

      log('building...')
      await clear.buildDir()
      await build(false, afterFirstBuild)
      await npm.install()

      console.log(
        "\nBuild Complete! Check your .flint/build directory\n".green.bold
      )

      if (OPTS.watch)
        gulp.watch(SCRIPTS_GLOB, ['build'])
      else
        process.exit()
    }
    else {
      log('running...')
      await clear.outDir()
      await server()
      bridge.start(wport())
      writeWPort(wport())
      buildScripts()
      await afterFirstBuild()
      await npm.install()
      openInBrowser()
      watchingMessage()
    }
  }
  catch(e) {
    if (!e.silent)
      handleError(e)
  }
}
