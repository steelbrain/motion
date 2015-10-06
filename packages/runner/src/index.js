import flint from './compiler'
import react from './gulp/react'
import babel from './gulp/babel'
import bridge from './bridge/message'
// import watchEditor from './bridge/watchEditor'
import handleError from './lib/handleError'
import copyFile from './lib/copyFile'
import recreateDir from './lib/recreateDir'
import npm from './lib/npm'

import fs from 'fs'
import path from 'path'
import express from 'express'
import cors from 'cors'
import del from 'del'
import mkdirp from 'mkdirp'
import jf from 'jsonfile'
import hostile from 'hostile'
import through from 'through2'
import gulp from 'gulp'
import rename from 'gulp-rename'
import watch from 'gulp-watch'
import filter from 'gulp-filter'
import plumber from 'gulp-plumber'
import debug from 'gulp-debug'
import changed from 'gulp-changed'
import concat from 'gulp-concat'
import wrap from 'gulp-wrap'
import multipipe from 'multipipe'
import gulpif from 'gulp-if'
import stripAnsi from 'strip-ansi'
import portfinder from 'portfinder'
import cp from 'child_process'
import open from 'open'
import readdirp from 'readdirp'
import webpack from 'webpack'
import editor from 'editor'
import { Promise } from 'bluebird'

const exec = cp.exec
const spawn = cp.spawn
const p = path.join
const proc = process
const newLine = "\n"
const SCRIPTS_GLOB = [ '**/*.js', '!node_modules{,/**}', '!.flint{,/**}' ]

let lastSavedTimestamp = {}
let APP_DIR = path.normalize(process.cwd());
let MODULES_DIR = p(__dirname, '..', 'node_modules');
let APP_FLINT_DIR = p(APP_DIR, '.flint');
let APP_VIEWS = {}
let HAS_RUN_INITIAL_BUILD = false
let OPTS, CONFIG, ACTIVE_PORT

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
}

gulp.task('build', buildScripts)

const readConfig = () =>
  new Promise((res, rej) =>
    jf.readFile(OPTS.configFile, function(err, confObj) {
      if (err) return rej(err)
      CONFIG = confObj
      res()
    }))

// prompts for domain they want to use
const firstRunPreferences = () =>
  new Promise((res, rej) => {
    const hasRunBefore = OPTS.build || CONFIG
    if (hasRunBefore) return res()

    askForUrlPreference(useFriendly => {
      CONFIG = { friendlyUrl: OPTS.url, useFriendly: useFriendly }
      openInBrowser()
      writeConfig(CONFIG)
      res()
    })
  })

const clearBuildDir = () =>
  new Promise((res, rej) =>
    recreateDir(p(APP_FLINT_DIR, 'build'))
      .catch(rej)
      .then(() => {
        mkdirp(p(APP_FLINT_DIR, 'build', '_'), err => {
          if (err) return rej(err)
          res()
        })
      })
    )

const clearOutDir = () =>
  recreateDir(p(APP_FLINT_DIR, 'out'))

const initCompiler = () => {
  return new Promise((res, rej) => {
    flint('init', {
      dir: APP_FLINT_DIR,
      after: res
    })
  })
}

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
    fn(file)
    next(null, file);
  })
}

function cat(msg) {
  return pipefn(() => msg && console.log(msg))
}

function build() {
  buildFlint();
  buildReact();
  buildPackages();
  buildAssets();
  buildScripts(buildTemplate);
}

function mkBuildDir(cb) {
  mkdirp(p(OPTS.buildDir, '_'), handleError(cb));
}

function buildTemplate() {
  var template = p(APP_FLINT_DIR, 'index.html');
  var out = p(OPTS.buildDir, 'index.html');

  fs.readFile(template, 'utf8', handleError(function(data) {
    data = data
      .replace('/static', '/_/static')
      .replace('<!-- SCRIPTS -->', [
        '<script src="/_/react.js"></script>',
        '  <script src="/_/flint.js"></script>',
        '  <script src="/_/packages.js"></script>',
        '  <script src="/_/'+OPTS.name+'.js"></script>',
        '  <script>window.Flint = flintRun_'+OPTS.name+'("_flintapp", { namespace:window, app:"userMain" });</script>'
      ].join(newLine))

    // TODO: try running flint build --isomorphic
    if (OPTS.isomorphic) {
      var Flint = require('flint-js/dist/flint.node');
      var app = require(p(OPTS.buildDir, '_', OPTS.name));

      var FlintApp = app(false, { Flint }, function(output) {
        data = data.replace(
          '<div id="_flintapp"></div>',
          '<div id="_flintapp">' + output + '</div>'
        )

        fs.writeFile(out, data, handleError);
      })
    }
    else {
      fs.writeFile(out, data, handleError);
    }
  }));
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

  stream.on('end', function() {
    done('assets');
  })
}

function buildScripts(cb, stream) {
  log('build scripts')
  let gulpErr, gulpScript;
  let gulpStartTime = Date.now();
  let gulpDest = OPTS.buildDir ? p(OPTS.buildDir, '_') : OPTS.outDir || '.';
  let buildingTimeout

  return (stream ? stream : gulp.src(SCRIPTS_GLOB))
    .pipe(gulpif(!OPTS.build,
      watch(SCRIPTS_GLOB)
    ))
    .pipe(through.obj(function(file, enc, next) {
      // reset
      gulpErr = false;
      gulpScript = null;

      // time build
      gulpStartTime = Date.now();
      file.startTime = gulpStartTime
      next(null, file);
    }))
    .pipe(debug({ title: 'build:', minimal: true }))
    .pipe(plumber({
      errorHandler: function(err) {
        gulpErr = true;

        if (err.stack || err.codeFrame)
          err.stack = stripAnsi(unicodeToChar(err.stack || err.codeFrame));

        if (err.plugin == 'gulp-babel') {
          console.log('JS error: %s: ', err.message.replace(APP_DIR, ''));
          if (err.name != 'TypeError' && err.loc)
            console.log('  > line: %s, col: %s', err.loc.line, err.loc.column);
          console.log(' Stack:', newLine, err.stack)
        }
        else
          console.log('ERROR', err);

        var path = err.fileName

        bridge.message('compile:error', { error: err });
      }
    }))
    .pipe(through.obj(function(file, enc, next) {
      if (!OPTS.build) {
        var name = file.path.replace(APP_DIR, '');
        gulpScript = {
          name: name,
          compiledAt: gulpStartTime
        }
      }
      next(null, file);
    }))
    .pipe(flint('pre', {
      setViewLocations: function(views) {
        return
        if (OPTS.build) return;
        Object.assign(APP_VIEWS, views);
        bridge.message('view:locations', APP_VIEWS);
      }
    }))
    .pipe(babel({
      stage: 2,
      blacklist: ['flow', 'react', 'es6.tailCall'],
      retainLines: true,
      optional: ['bluebirdCoroutines']
    }))
    .pipe(flint('post', {
      dir: APP_FLINT_DIR,
      onPackageStart: function(name, cb) {
        bridge.message('package:install', { name })
      },
      onPackageError: function(error) {
        bridge.message('package:error', { error })
      },
      onPackageFinish: function(name) {
        log('finish package, make new bundle', name)
        makeDependencyBundle(() => {
          bridge.message('package:installed', { name })
          bridge.message('packages:reload', {})
        });
      }
    }))
    .pipe(gulpif(!stream, rename({ extname: '.js' })))
    .pipe(react({
      stripTypes: true,
      es6module: true
    }))
    .pipe(gulpif(OPTS.build,
      multipipe(
        concat(OPTS.name + '.js'),
        wrap({ src: __dirname + '/../templates/build.template.js' }, { name: OPTS.name } , { variable: 'data' })
      )
    ))
    .pipe(gulpif(function(file) {
      if (stream) return false
      if (gulpErr) return false

      var endTime = Date.now() - gulpStartTime;
      log('build took ', endTime, 'ms')

      log('new file time', file.startTime, lastSavedTimestamp[file.path])
      if (!lastSavedTimestamp[file.path] || file.startTime > lastSavedTimestamp[file.path]) {
        lastSavedTimestamp[file.path] = file.startTime
        return true
      }
      return false
    },
      gulp.dest(gulpDest))
    )
    .pipe(through.obj(function(file, enc, next) {
      if (!gulpErr) {
        bridge.message('script:add', gulpScript);
        bridge.message('compile:success', gulpScript);
      }

      if (cb && !(OPTS.build && OPTS.watch)) {
        cb(stream ? file.contents.toString() : undefined)
      }

      if (OPTS.build && !OPTS.watch)
        done('scripts');

      next(null, file)
    }))
    // watch for first complete build to finish
    .pipe(pipefn(() => {
      if (HAS_RUN_INITIAL_BUILD) return
      if (buildingTimeout) clearTimeout(buildingTimeout)
      buildingTimeout = setTimeout(() => {
        HAS_RUN_INITIAL_BUILD = true
        runAfterFirstBuilds()
      }, 450)
    }))
}

function setOptions(opts, build) {
  OPTS = opts || {}
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
    console.log("\nBuilding %s to %s\n".bold.white, OPTS.name + '.js', path.normalize(OPTS.buildDir))
  }
}

function writeConfig(config) {
  jf.writeFile(OPTS.configFile, config);
}

function listenForKeys() {
  var keypress = require('keypress');
  keypress(proc.stdin);

  // listen for the "keypress" event
  proc.stdin.on('keypress', function (ch, key) {
    if (!key) return;

    // open browser
    if (key.name == 'o')
      openInBrowser();

    // open editor
    if (key.name == 'e')
      editor('.')

    // install npm
    if (key.name == 'i')
      makeDependencyBundle(null, true);

    // verbose logging
    if (key.name == 'v') {
      OPTS.verbose = !OPTS.verbose;
      console.log(OPTS.verbose ? 'Set to log verbosely'.yellow : 'Set to log quietly'.yellow, newLine);
    }

    // exit
    if (key.ctrl && key.name == 'c')
      process.exit();
  });

  resumeListenForKeys();
}

function openInBrowser() {
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
      '<script src="/__/devtools.js"></script>',
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

function allowCrossDomain(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}

function runServer() {
  return new Promise((res, rej) => {
    var server = express();
    server.use(cors());
    server.use(allowCrossDomain)

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

let template
function makeTemplate(req, cb) {
  if (!template)
    template = fs.readFileSync(OPTS.dir + '/' + OPTS.template).toString();

  var files = []

  readdirp({ root: p(APP_FLINT_DIR, 'out') },
    function(err, res) {
      var mainIndex = -1;

      files = res.files.map(function(file, i) {
        if (file.path == 'main.js')
          mainIndex = i;

        return file.path;
      });

      if (mainIndex !== -1) {
        files.move(mainIndex, 0);
      }

      if (!files) {
        console.log('no flint files');
        cb(template);
      }
      else
        cb(template.replace('<!-- SCRIPTS -->',
          '<div id="_flintdevtools"></div>'
          + newLine
          + getScriptTags(files, req)
        ));
    });
}

function log(...args) {
  if (OPTS.debug || OPTS.verbose) console.log(...args)
}

function unicodeToChar(text) {
  return !text ? '' : text.replace(/\\u[\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef]/g,
    function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

function debounce(fn, delay) {
  var timeout;
  return function() {
    var args = arguments
    clearTimeout(timeout);
    timeout = setTimeout(function() { fn.apply(null, args) }, timeout ? delay : 0)
  }
}

function makeDependencyBundle(cb, doInstall) {
  console.log('Checking packages...'.bold.blue)
  let preInstall = cb => cb()

  // TODO: make this do a check if it needs to run on startup
  if (doInstall) {
    preInstall = cb => npm.install(p(APP_FLINT_DIR)).then(cb)
  }

  preInstall(() => {
    fs.readFile(p(APP_FLINT_DIR, 'package.json'), handleError(file => {
      const depsObject = JSON.parse(file).dependencies
      const deps = Object.keys(depsObject)
        .filter(p => ['flint-js', 'react'].indexOf(p) < 0)

      const requireString = deps
        .map(name => `window.__flintPackages["${name}"] = require("${name}");`)
        .join(newLine)

      const DEP_DIR = p(APP_FLINT_DIR, 'deps')
      const DEPS_FILE = p(DEP_DIR, 'deps.js')

      const bundleDeps = () => {
        webpack({
          entry: DEPS_FILE,
          externals: {
            react: 'React',
            bluebird: '_bluebird'
          },
          output: { filename: p(DEP_DIR, 'packages.js') }
        }, handleError(() => {
          if (deps.length)
            console.log(`Installed ${deps.length} packages: ${deps.join(', ')}`.blue.bold)

          if (cb) cb();
        }))
      }

      const writeDeps = () => {
        fs.writeFile(DEPS_FILE, requireString,
          handleError(bundleDeps))
      }

      // make dep dir
      mkdirp(DEP_DIR, handleError(writeDeps))
    }))
  })
}

var isDone = {};
function done(which) {
  isDone[which] = true;
  if (isDone.scripts && isDone.assets)
    process.exit();
}

function wport() {
  return 2283 + parseInt(ACTIVE_PORT, 10)
}

export async function run(opts, isBuild) {
  setOptions(opts, isBuild)

  await readConfig()
  await firstRunPreferences()

  // building...
  if (OPTS.build) {
    await clearBuildDir()
    await makeDependencyBundle(build, true);
    await afterFirstBuild()
    console.log("\nBuild Complete! Check your .flint/build directory\n".green.bold)

    if (OPTS.watch)
      gulp.watch(SCRIPTS_GLOB, ['build'])
  }
  // running...
  else {
    await clearOutDir()
    await runServer()
    bridge.start(wport())
    await initCompiler()
    buildScripts()
    await afterFirstBuild()
    openInBrowser()
    watchingMessage()
  }
}