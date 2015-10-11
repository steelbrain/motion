import compiler from './compiler'
import react from './gulp/react'
import babel from './gulp/babel'
import bridge from './bridge/message'
import handleError from './lib/handleError'
import npm from './npm'
import log from './lib/log'
import cache from './cache'
import unicodeToChar from './lib/unicodeToChar'
import { p, mkdir, readdir, readJSON, writeJSON,
  readFile, writeFile, recreateDir, copyFile } from './lib/fns'
import { Promise } from 'bluebird'
import multipipe from 'multipipe'
import portfinder from 'portfinder'
import open from 'open'
import editor from 'editor'
import keypress from 'keypress'
import path from 'path'
import express from 'express'
import cors from 'cors'
import hostile from 'hostile'
import through from 'through2'
import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
const $ = loadPlugins()

Promise.longStackTraces()

const proc = process // cache for keypress
const newLine = "\n"
const SCRIPTS_GLOB = [ '**/*.js', '!node_modules{,/**}', '!.flint{,/**}' ]
const APP_DIR = path.normalize(process.cwd());
const MODULES_DIR = p(__dirname, '..', 'node_modules');
const APP_FLINT_DIR = p(APP_DIR, '.flint');

let lastSavedTimestamp = {}
let APP_VIEWS = {}
let HAS_RUN_INITIAL_BUILD = false
let OPTS, CONFIG, ACTIVE_PORT

gulp.task('build', buildScripts)

// prompts for domain they want to use
const firstRun = () =>
  new Promise((res, rej) => {
    const hasRunBefore = OPTS.build || CONFIG
    log('first run hasRunBefore:', hasRunBefore)

    if (hasRunBefore)
      return res(false)

    askForUrlPreference(useFriendly => {
      CONFIG = { friendlyUrl: OPTS.url, useFriendly: useFriendly }
      openInBrowser()
      writeConfig(CONFIG)
      res(true)
    })
  })

const clearBuildDir = () => {
  return new Promise((res) => {
    log('clearBuildDir')
    recreateDir(p(APP_FLINT_DIR, 'build'))
    .then(async () => {
      log('clearBuildDir: make _ dir')
      try {
        await mkdir(p(APP_FLINT_DIR, 'build', '_'))
        res()
      } catch(e) {
        console.error(e)
      }
    })
  })
}

const clearOutDir = () =>
  recreateDir(p(APP_FLINT_DIR, 'out'))

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

function watchingMessage() {
  listenForKeys()
  console.log(
    newLine +
    ' • O'.green.bold + 'pen browser'.green + newLine +
    ' • E'.green.bold + 'ditor'.green + newLine +
    ' • I'.green.bold + 'nstall packages'.green + newLine +
    ' • V'.green.bold + 'erbose logging'.green + newLine
  )
  resumeListenForKeys()
}

function pipefn(fn) {
  return through.obj(function(file, enc, next) {
    fn && fn(file)
    next(null, file);
  })
}
const Z = pipefn()

function cat(msg) {
  return pipefn(() => msg && console.log(msg))
}

async function buildTemplate() {
  const out = p(OPTS.buildDir, 'index.html')
  const data = await readFile(p(APP_FLINT_DIR, 'index.html'), 'utf8')
  let template = data
    .replace('/static', '/_/static')
    .replace('<!-- SCRIPTS -->', [
      '<script src="/_/react.js"></script>',
      '  <script src="/_/flint.js"></script>',
      '  <script src="/_/packages.js"></script>',
      '  <script src="/_/'+OPTS.name+'.js"></script>',
      '  <script>window.Flint = flintRun_'+OPTS.name+'("_flintapp", { namespace:window, app:"userMain" });</script>'
    ].join(newLine))

  // TODO: flint build --isomorphic
  if (OPTS.isomorphic) {
    var Flint = require('flint-js/dist/flint.node');
    var app = require(p(OPTS.buildDir, '_', OPTS.name));

    var FlintApp = app(false, { Flint }, async function(output) {
      template = template.replace(
        '<div id="_flintapp"></div>',
        '<div id="_flintapp">' + output + '</div>'
      )

      await writeFile(out, template)
    })
    return
  }

  await writeFile(out, template)
}

function buildFlint(cb) {
  var read = p(MODULES_DIR, 'flint-js', 'dist', 'flint.prod.js');
  var write = p(OPTS.buildDir, '_', 'flint.js');
  copyFile(read, write, cb)
}

function buildReact(cb) {
  var read = p(MODULES_DIR, 'flint-js', 'dist', 'react.prod.js');
  var write = p(OPTS.buildDir, '_', 'react.js');
  copyFile(read, write, cb)
}

function buildPackages(cb) {
  var read = p(APP_FLINT_DIR, 'deps', 'packages.js')
  var write = p(OPTS.buildDir, '_', 'packages.js')
  copyFile(read, write, cb);
}

function buildAssets() {
  gulp.src('.flint/static/**')
    .pipe(gulp.dest(p(OPTS.buildDir, '_', 'static')))

  var stream = gulp
    .src(['*', '**/*', '!**/*.js', ], { dot: false })
    .pipe(gulp.dest(p(OPTS.buildDir)));
}

const watchDeletes = vinyl => {
  if (vinyl.event == 'unlink') {
    cache.remove(vinyl.path)
  }
}

function buildScripts(cb, stream) {
  console.log("Building...".bold.white)
  log('build scripts')
  let lastError, lastScript, curFile, buildingTimeout
  let startTime = Date.now()
  let dest = OPTS.buildDir ? p(OPTS.buildDir, '_') : OPTS.outDir || '.'

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
      console.log(' ⇢ ', path.relative(APP_DIR, file.path))
    }))
    .pipe($.plumber(error => {
      lastError = true
      logError(error, curFile)
      bridge.message('compile:error', { error })
    }))
    .pipe(pipefn(file => {
      if (OPTS.build) return
      let name = file.path.replace(APP_DIR, '')
      lastScript = { name, compiledAt: startTime }
      curFile = file
    }))
    .pipe(compiler('pre'))
    .pipe(babel({
      stage: 2,
      blacklist: ['flow', 'react', 'es6.tailCall'],
      retainLines: true,
      comments: true,
      optional: ['bluebirdCoroutines']
    }))
    .pipe(compiler('post', {
      dir: APP_FLINT_DIR,
      onPackageStart: (name) => {
        bridge.message('package:install', { name })
      },
      onPackageError: (name, error) => {
        bridge.message('package:error', { name, error })
      },
      onPackageFinish: async (name) => {
        if (OPTS.build) return
        log('runner: onPackageFinish: ', name)
        bridge.message('package:installed', { name })
        updatePackages()
      }
    }))
    .pipe($.if(!stream,
      $.rename({ extname: '.js' })
    ))
    .pipe(react({
      stripTypes: true,
      es6module: true
    }))
    .pipe($.if(OPTS.build,
      multipipe(
        $.concat(OPTS.name + '.js'),
        $.wrap({ src: __dirname + '/../templates/build.template.js' }, { name: OPTS.name } , { variable: 'data' })
      )
    ))
    .pipe($.if(function(file) {
      if (stream) return false
      if (lastError) return false

      const endTime = Date.now() - startTime;
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
    },
      gulp.dest(dest))
    )
    .pipe(pipefn(file => {
      log('HAS_RUN_INITIAL_BUILD', HAS_RUN_INITIAL_BUILD)
      log('lastError', lastError)

      // after initial build
      if (HAS_RUN_INITIAL_BUILD) {
        if (!lastError) {
          bridge.message('script:add', lastScript);
          bridge.message('compile:success', lastScript);
        }
      }
      // before initial build
      else {
        if (buildingTimeout) clearTimeout(buildingTimeout)
        buildingTimeout = setTimeout(() => {
          HAS_RUN_INITIAL_BUILD = true
          runAfterFirstBuilds()
        }, 450)
      }
    }))
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
    .pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn()).pipe(pipefn())
}

function logError(error, file) {
  if (error.stack || error.codeFrame)
    error.stack = unicodeToChar(error.stack || error.codeFrame);

  if (error.plugin == 'gulp-babel') {
    console.log('JS error: %s: ', error.message.replace(APP_DIR, ''));
    if (error.name != 'TypeError' && error.loc)
      console.log('  > line: %s, col: %s', error.loc.line, error.loc.column);
    console.log(' Stack:', newLine, error.stack)
  }
  else {
    console.log('ERROR', "\n", error)
    console.log('FILE', "\n", file.contents.toString())
  }
}

function updatePackages() {
  bridge.message('packages:reload', {})
}

function setOptions(opts, build) {
  // from cli
  OPTS = {}
  OPTS.debug = opts.debug || opts.verbose
  OPTS.port = opts.port
  OPTS.host = opts.host
  OPTS.watch = opts.watch

  OPTS.build = build

  OPTS.defaultPort = 4000
  OPTS.dir = OPTS.dir || APP_DIR
  OPTS.template = OPTS.template || '.flint/index.html'

  OPTS.configFile = p(APP_FLINT_DIR, 'config')
  OPTS.outDir = p(APP_FLINT_DIR, 'out')

  OPTS.name = path.basename(process.cwd())

  var folders = OPTS.dir.split('/')
  OPTS.name = folders[folders.length - 1]
  OPTS.url = OPTS.name + '.dev'

  if (OPTS.build) {
    OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(APP_FLINT_DIR, 'build')
  }
}

function writeConfig(config) {
  writeJSON(OPTS.configFile, config)
}

function listenForKeys() {
  keypress(proc.stdin)

  // listen for the "keypress" event
  proc.stdin.on('keypress', async function (ch, key) {
    if (!key) return

    switch(key.name) {
      case 'o': // open browser
        openInBrowser(true)
        break
      case 'e': // open editor
        editor('.')
        break
      case 'i': // install npm
        console.log("Installing npm packages...".white.bold)
        await npm.bundle()
        updatePackages()
        console.log('Packages updated!'.green.bold)
        break
      case 'v': // verbose logging
        OPTS.verbose = !OPTS.verbose
        setLogging(OPTS)
        console.log(OPTS.verbose ? 'Set to log verbosely'.yellow : 'Set to log quietly'.yellow, newLine)
        break
    }

    // exit
    if (key.ctrl && key.name == 'c')
      process.exit()
  });

  resumeListenForKeys()
}

function openInBrowser(force) {
  if (OPTS.debug && !force) return
  if (CONFIG.useFriendly) {
    open('http://' + CONFIG.friendlyUrl);
  } else {
    open('http://localhost:' + ACTIVE_PORT);
  }
}

function resumeListenForKeys() {
  // listen for keys
  proc.stdin.setRawMode(true);
  proc.stdin.resume();
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
      '<script>_FLINT_WEBSOCKET_PORT = ' + wport() + '</script>',
      '<script src="/__/devtools.dev.js"></script>',
      // devtools
      devToolsDisabled(req) ? '' : [
        '<script src="/__/tools.js"></script>',
        '<script>flintRun_tools("_flintdevtools", { app: "devTools" });</script>'
      ].join(newLine),
      // user files
      '<script>window.Flint = runFlint(window.renderToID || "_flintapp", { namespace: window, app: "userMain" });</script>',
      assetScriptTags(files),
      '<script>Flint.render()</script>',
      '<!-- END FLINT JS -->'
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

    // USER files
    // user js files at '/_/filename.js'
    server.use('/_', express.static('.flint/out'));
    // user non-js files
    server.use('/', express.static('.'));
    // user static files...
    server.use('/_/static', express.static('.flint/static'));

    // INTERNAL files
    // packages.js
    server.use('/__', express.static('.flint/deps'));
    // tools.js
    server.use('/__', express.static(p(MODULES_DIR, 'flint-tools', 'build', '_')));
    // flint.js & react.js
    server.use('/__', express.static(p(MODULES_DIR, 'flint-js', 'dist')));

    server.get('*', function(req, res) {
      runAfterFirstBuildComplete(function() {
        makeTemplate(req, function(template) {
          res.send(template.replace('/static', '/_/static'));
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

      ACTIVE_PORT = port
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
        portfinder.getPort({ host: 'localhost' }, handleError(serverListen) );
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
  const dir = await readdir({ root: p(APP_FLINT_DIR, 'out') })
  const files = dir.files

  if (!files.length) {
    console.log('no flint files')
    return cb(template.toString())
  }

  let paths = files.map(file => file.path)
  const mainIndex = paths.indexOf('main.js')

  if (mainIndex !== -1)
    paths.move(mainIndex, 0)

  const fullTemplate = template.toString().replace('<!-- SCRIPTS -->',
    '<div id="_flintdevtools"></div>'
    + newLine
    + getScriptTags(paths, req)
  )

  cb(fullTemplate)
}

function wport() {
  return 2283 + parseInt(ACTIVE_PORT, 10)
}

function setLogging(opts) {
  log.debug = opts.debug || opts.verbose
}

async function build() {
  log('0')
  buildFlint()
  log('0')
  buildReact()
  log('0')
  buildPackages()
  log('0')
  buildAssets()
  log('0')
  buildScripts()
  log('0')
  await afterFirstBuild()
  log('0')
  buildTemplate()
}

export async function run(opts, isBuild) {
  try {
    setOptions(opts, isBuild)
    setLogging(OPTS)
    log('run', OPTS)
    compiler('init', { dir: APP_FLINT_DIR })
    await npm.init({ dir: APP_FLINT_DIR })
    CONFIG = await readJSON(OPTS.configFile)
    log('got config', CONFIG)
    const isFirstRun = await firstRun()

    if (OPTS.build) {
      console.log(
        "\nBuilding %s to %s\n".bold.white,
        OPTS.name + '.js',
        path.normalize(OPTS.buildDir)
      )

      log('building...')
      await clearBuildDir()
      build()
      await* [
        npm.install(),
        afterFirstBuild()
      ]

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
      await clearOutDir()
      await runServer()
      bridge.start(wport())
      buildScripts()
      await afterFirstBuild()
      openInBrowser()
      watchingMessage()
    }
  }
  catch(e) {
    console.error(e)
  }
}
