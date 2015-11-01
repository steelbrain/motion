import compiler from './compiler'
import babel from './lib/gulp-babel'
import bridge from './bridge'
import handleError from './lib/handleError'
import build from './fbuild'
import npm from './npm'
import opts from './opts'
import log from './lib/log'
import cache from './cache'
import unicodeToChar from './lib/unicodeToChar'
import openInBrowser from './lib/openInBrowser'
import clear from './fbuild/clear'
import keys from './keys'
import { p, rmdir, readdir, readJSON, writeJSON, readFile } from './lib/fns'

import flintTransform from 'flint-transform'
import { Promise } from 'bluebird'
import multipipe from 'multipipe'
import portfinder from 'portfinder'
import path from 'path'
import express from 'express'
import cors from 'cors'
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
let APP_VIEWS = {}
let HAS_RUN_INITIAL_BUILD = false
let OPTS, CONFIG

gulp.task('build', buildScripts)

// prompts for domain they want to use
const firstRun = () =>
  new Promise(async (res, rej) => {
    try {
      CONFIG = await readJSON(OPTS.configFile)
      log('got config', CONFIG)
    }
    catch(e) {}

    const hasRunBefore = OPTS.build || CONFIG
    log('first run hasRunBefore:', hasRunBefore)

    if (hasRunBefore)
      return res(false)

    askForUrlPreference(useFriendly => {
      CONFIG = { friendlyUrl: OPTS.url, useFriendly: useFriendly }
      writeConfig(CONFIG)
      res(true)
    })
  })

/* FIRST BUILD STUFF */

let waitingForFirstBuild = []

const afterFirstBuild = () =>
  new Promise((res, rej) => {
    if (HAS_RUN_INITIAL_BUILD) return res()
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
const Z = pipefn()

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
    .pipe($.if(!OPTS.build,
      $.watch(SCRIPTS_GLOB, null, watchDeletes)
    ))
    .pipe(pipefn(file => {
      // reset
      curFile = file
      lastError = false
      lastScript = null
      // time build
      startTime = Date.now()
      file.startTime = startTime
      // log
      out.file(file)
    }))
    .pipe($.plumber(error => {
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
    }))
    .pipe(pipefn(file => {
      if (OPTS.build) return
      let name = file.path.replace(OPTS.appDir, '')
      lastScript = { name, compiledAt: startTime }
      curFile = file
    }))
    .pipe($p.flint.pre())
    .pipe($.sourcemaps.init())
    .pipe($p.babel())
    .pipe($p.flint.post())
    .pipe($.if(!stream,
      $.rename({ extname: '.js' })
    ))
    .pipe(pipefn(() => {
      // for spaces when outputting
      if (OPTS.build) console.log()
    }))
    .pipe($.if(file => !OPTS.build && !file.isInternal,
      $.sourcemaps.write('.')
    ))
    .pipe($.if(OPTS.build,
      $p.buildWrap()
    ))
    .pipe($.if(file => file.isInternal,
      multipipe(
        gulp.dest(internalDest),
        $.ignore.exclude(true)
      )
    ))
    .pipe($.if(file => {
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
    }, gulp.dest(outDest)))
    .pipe(pipefn(file => {
      if (file.isSourceMap) return

      log('HAS_RUN_INITIAL_BUILD', HAS_RUN_INITIAL_BUILD)
      log('lastError', lastError)

      // after initial build
      if (HAS_RUN_INITIAL_BUILD) {
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
    }))
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
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
  if (!HAS_RUN_INITIAL_BUILD) {
    log('buildFinishedCheck setTimeout')
    if (buildingTimeout) clearTimeout(buildingTimeout)
    buildingTimeout = setTimeout(() => {
      log('HAS_RUN_INITIAL_BUILD = true')
      HAS_RUN_INITIAL_BUILD = true

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

function getScriptTags(files, req) {
  return newLine +
    [
      '<!-- FLINT JS -->',
      '<script src="/__/react.dev.js"></script>',
      '<script src="/__/flint.dev.js"></script>',
      '<script src="/__/packages.js" id="__flintPackages"></script>',
      '<script src="/__/internals.js" id="__flintInternals"></script>',
      '<script>_FLINT_WEBSOCKET_PORT = ' + wport() + '</script>',
      '<script src="/__/devtools.dev.js"></script>',
      // devtools
      devToolsDisabled(req) ? '' : [
        '<script src="/__/tools/packages.js"></script>',
        '<script src="/__/tools/internals.js"></script>',
        '<script src="/__/tools/tools.js"></script>',
        '<script>flintRun_tools("_flintdevtools", { app: "devTools" });</script>'
      ].join(newLine),
      // user files
      `<script>window.Flint = runFlint(window.renderToID || "_flintapp", { app: "${OPTS.name}" });</script>`,
      newLine,
      '<!-- APP -->',
      assetScriptTags(files),
      '<script>Flint.init()</script>',
      '<!-- END APP -->'
    ].join(newLine)
}

function assetScriptTags(scripts) {
  return scripts.map(function(file) {
    return '<script src="/_/' + file + '"></script>';
  }).join(newLine);
}

function devToolsDisabled(req) {
  return CONFIG.tools === 'false' || req && req.query && req.query['!dev'];
}

function runServer() {
  return new Promise((res, rej) => {
    var server = express();
    server.use(cors());
    server.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      next();
    })

    const staticOpts =  {
      redirect: false
    }

    // USER files
    // user js files at '/_/filename.js'
    server.use('/_', express.static('.flint/out'));
    // user non-js files
    server.use('/', express.static('.', staticOpts));
    // user static files...
    server.use('/_/static', express.static('.flint/static'));

    // INTERNAL files
    // packages.js
    server.use('/__', express.static('.flint/deps'));
    // tools.js
    server.use('/__/tools', express.static(p(OPTS.modulesDir, 'flint-tools', 'build', '_')));
    // flint.js & react.js
    server.use('/__', express.static(p(OPTS.modulesDir, 'flint-js', 'dist')));

    server.get('*', function(req, res) {
      runAfterFirstBuildComplete(function() {
        makeTemplate(req, function(template) {
          res.send(template.replace(/\/static/g, '/_/static'));
        })
      })

      setTimeout(bridge.message.bind(this, 'view:locations', APP_VIEWS), 200)
    });

    function runAfterFirstBuildComplete(cb) {
      if (HAS_RUN_INITIAL_BUILD) cb();
      else setTimeout(runAfterFirstBuildComplete.bind(null, cb), 150);
    }

    function serverListen(port) {
      process.stdout.write("\nFlint app running on ".white)
      console.log(
        "http://%s".bold + newLine,
        host + (port && port !== 80 ? ':' + port : '')
      );

      opts.set('port', port)
      res();
      server.listen(port, host);
    }

    var host = 'localhost'
    var useFriendly = CONFIG.useFriendly || false

    // friendly = site.dev
    if (!useFriendly) {
      var port = OPTS.port || OPTS.defaultPort;

      // if no specified port, find open one
      if (!OPTS.port) {
        portfinder.basePort = port;
        portfinder.getPort({ host: 'localhost' },
          handleError(serverListen)
        );
      }
      else {
        serverListen(port);
      }
    }
    else {
      serverListen(80);
    }
  })
}

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
}

async function makeTemplate(req, cb) {
  const templatePath = p(OPTS.dir, OPTS.template)
  const template = await readFile(templatePath)
  const dir = await readdir({ root: p(OPTS.flintDir, 'out') })
  const files = dir.files.filter(f => /\.jsf?$/.test(f.name)) // filter sourcemaps
  const hasFiles = files.length

  let paths = []

  if (hasFiles) {
    paths = files.map(file => file.path)

    let mainIndex = 0

    paths.forEach((p, i) => {
      if (/[Mm]ain\.jsf?$/.test(p))
        mainIndex = i
    })

    if (mainIndex !== -1)
      paths.move(mainIndex, 0)
  }

  const fullTemplate = template.toString().replace('<!-- SCRIPTS -->',
    '<div id="_flintdevtools"></div>'
    + newLine
    + getScriptTags(paths, req)
  )


  cb(fullTemplate)
}

function wport() {
  return 2283 + parseInt(opts.get('port'), 10)
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
      await runServer()
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
