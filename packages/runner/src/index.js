import flint from './compiler'
import react from './gulp/react'
import babel from './gulp/babel'
import bridge from './bridge/message'
import watchEditor from './bridge/watchEditor'
import handleError from './lib/handleError'
import copyFile from './lib/copyFile'
import recreateDir from './lib/recreateDir'

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
import browserify from 'browserify'
import editor from 'editor'

const exec = cp.exec;
const spawn = cp.spawn;

var p = path.join;
var proc = process;
var newLine = "\n";
var lastSavedTimestamp = {}
var APP_DIR = path.normalize(process.cwd());
var FLINT_DIR = p(APP_DIR, '.flint');
var OPTS, CONFIG, CONFIG_DIR, TYPED_OUT_DIR, OUT_DIR,
    BUILD_ONLY, BUILD_DIR, BUILD_NAME,
    VERBOSE, TEMPLATE, WSS, CUSTOM_OUT, DEV_URL, APP_NAME,
    HAS_RUN_INITIAL_BUILD, ACTIVE_PORT;
var APP_VIEWS = {};

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

var SCRIPTS_GLOB = [
  '**/*.js',
  '!node_modules{,/**}',
  '!.flint{,/**}'
];

gulp.task('build', buildScripts)

function main(opts, isBuild) {
  setGlobals(opts, isBuild);
  readConfig(function() {
    firstRun(function() {
      writeFlowFile();

      clearBuildDir(function() {
        if (BUILD_ONLY) {
          build();

          if (OPTS.watch)
            gulp.watch(SCRIPTS_GLOB, ['build'])
        }
        else {
          runServer(function() {
            bridge.start(wport());
          });
          watchEditor();
          buildScripts();
          makeDependencyBundle();
          setTimeout(openInBrowser, 100)
        }
      })
    });
  });
}

function cat(msg) {
  return through.obj(function(file, enc, next) {
    if (msg) console.log(msg);
    next(null, file);
  })
}

function clearBuildDir(cb) {
  recreateDir(p(FLINT_DIR, 'out'), function() {
    recreateDir(p(FLINT_DIR, 'build'), cb)
  })
}

function build() {
  buildFlint();
  buildPackages();
  buildAssets();

  buildScripts(function() {
    buildTemplate();
  });
}

function mkBuildDir(cb) {
  mkdirp(p(BUILD_DIR, '_'), handleError(cb));
}

function buildTemplate() {
  var template = p(FLINT_DIR, 'index.html');
  var out = p(BUILD_DIR, 'index.html');

  fs.readFile(template, 'utf8', handleError(function(data) {
    data = data
      .replace('/static', '/_/static')
      .replace('<!-- SCRIPTS -->', (
        '<script src="/_/flint.js"></script>' +
        '<script src="/_/packages.js"></script>' +
        newLine + '<script src="/_/'+BUILD_NAME+'.js"></script>' +
        newLine + '<script>window.Flint = flintRun_'+BUILD_NAME+'("_flintapp", { namespace:window, app:"userMain" });</script>'
      ))

    // TODO: try running flint build --isomorphic
    if (OPTS.isomorphic) {
      var Flint = require('flintjs/dist/flint.node');
      var app = require(p(BUILD_DIR, '_', BUILD_NAME));

      var FlintApp = app(false, { Flint: Flint }, function(output) {
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
  var read = p(__dirname, 'node_modules/flintjs/dist/flint.prod.js');
  var write = p(BUILD_DIR, '_', 'flint.js');
  copyFile(read, write, cb)
}

function buildPackages(cb) {
  var read = p(FLINT_DIR, 'deps', 'packages.js')
  var write = p(BUILD_DIR, '_', 'packages.js')
  copyFile(read, write, cb);
}

function buildAssets() {
  gulp.src('.flint/static/**')
    .pipe(gulp.dest(p(BUILD_DIR, '_', 'static')))

  var stream = gulp
    .src(['*', '**/*', '!**/*.js', ], { dot: false })
    .pipe(gulp.dest(p(BUILD_DIR)));

  stream.on('end', function() {
    done('assets');
  })
}

function buildScripts(cb) {
  log('build scripts')
  var gulpErr, gulpScript;
  var gulpStartTime = Date.now();
  var gulpDest = BUILD_DIR ? p(BUILD_DIR, '_') : OUT_DIR;

  return gulp.src(SCRIPTS_GLOB)
    .pipe(gulpif(!BUILD_ONLY,
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
    .pipe(gulpif(VERBOSE,
      debug({ title: 'build:', minimal: false }),
      debug({ title: 'build:', minimal: true })
    ))
    .pipe(plumber({
      errorHandler: function(err) {
        gulpErr = true;

        if (err.stack || err.codeFrame)
          err.stack = stripAnsi(unicodeToChar(err.stack || err.codeFrame));

        if (err.plugin == 'gulp-babel') {
          console.log('JS error: %s: '.red.bold, err.message.replace(APP_DIR, ''));
          if (err.name != 'TypeError' && err.loc)
            console.log('  > line: %s, col: %s'.red.bold, err.loc.line, err.loc.column);
          console.log(' Stack:', newLine, err.stack)
        }
        else
          console.log('ERROR'.red.bold, err);

        var path = err.fileName

        bridge.message('compile:error', { error: err });
      }
    }))
    .pipe(through.obj(function(file, enc, next) {
      if (!BUILD_ONLY) {
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
        if (BUILD_ONLY) return;
        Object.assign(APP_VIEWS, views);
        bridge.message('view:locations', APP_VIEWS);
      }
    }))
    .pipe(babel({
      stage: 0,
      blacklist: ['flow', 'react'],
      optional: ['bluebirdCoroutines']
    }))
    .pipe(flint('post', {
      dir: FLINT_DIR,
      onPackageStart: function(name) {
        bridge.message('package:install', { name: name })
      },
      onPackage: function(name) {
        console.log('UPDATE PACKAGES', name)
        makeDependencyBundle();
        bridge.message('package:installed', { name: name })
        bridge.message('packages:reload', {})
      }
    }))
    .pipe(rename({ extname: '.js' }))
    .pipe(gulp.dest(TYPED_OUT_DIR))
    .pipe(react({
      stripTypes: true,
      es6module: true
    }))
    // wrap in file scope
    .pipe(wrap({ src: __dirname + '/../templates/file.template.js' }))
    .pipe(gulpif(BUILD_ONLY,
      multipipe(
        concat(BUILD_NAME + '.js'),
        wrap({ src: __dirname + '/../templates/build.template.js' }, { name: BUILD_NAME } , { variable: 'data' })
      )
    ))
    .pipe(gulpif(function(file) {
      if (!gulpErr)
        gulp.dest(gulpDest);
      else
        return false

      var endTime = Date.now() - gulpStartTime;
      log('build took ', endTime, 'ms')

      log('new file time', file.startTime, lastSavedTimestamp[file.path])
      if (!lastSavedTimestamp[file.path] || file.startTime > lastSavedTimestamp[file.path]) {
        lastSavedTimestamp[file.path] = file.startTime
        return true
      }
      return false
    }, gulp.dest(gulpDest)))
    .pipe(through.obj(function(file, enc, next) {
      if (!gulpErr) {
        bridge.message('script:add', gulpScript);
        bridge.message('compile:success', gulpScript);

        // flow.check(function(passed, error) {
        //   if (!passed)
        //     bridge.message('compile:error', { error: error });
        // })
      }

      if (cb)
        cb();

      if (BUILD_ONLY && !OPTS.watch)
        done('scripts');

      if (!HAS_RUN_INITIAL_BUILD) {
        if (BUILD_ONLY) {
          console.log(
            newLine
            + 'Build Complete! Check your .flint/build directory'.green.bold
            + newLine
          );
        } else {
          listenForKeys();
          console.log(
            newLine +
            ' • O'.green.bold + 'pen browser'.green + newLine +
            ' • E'.green.bold + 'ditor'.green + newLine +
            ' • V'.green.bold + 'erbose logging'.green + newLine
          )
          HAS_RUN_INITIAL_BUILD = true;
          resumeListenForKeys();
        }
      }

      next(null, file)
    }))
    .pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat())
    .pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat())
    .pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat()).pipe(cat())
}

function setGlobals(opts, build) {
  BUILD_ONLY = build;
  OPTS = opts || {};

  OPTS.defaultPort = 4000
  OPTS.dir = OPTS.dir || APP_DIR;
  OPTS.template = OPTS.template || '.flint/index.html';

  CONFIG_DIR = p(FLINT_DIR, 'config');
  OUT_DIR = p(FLINT_DIR, 'out');
  TYPED_OUT_DIR = p(FLINT_DIR, 'typed');

  BUILD_NAME = (OPTS.outName || path.basename(process.cwd()));

  var folders = OPTS.dir.split('/');
  APP_NAME = folders[folders.length - 1]
  DEV_URL = APP_NAME + '.dev'

  if (BUILD_ONLY) {
    BUILD_DIR = OPTS.out ? p(OPTS.out) : p(FLINT_DIR, 'build');
    console.log("\nBuilding %s to %s\n".bold.white, BUILD_NAME + '.js', path.normalize(BUILD_DIR))
  }
}

function readConfig(cb) {
  jf.readFile(CONFIG_DIR, function(err, confObj) {
    CONFIG = confObj;
    log('got config', CONFIG)
    cb();
  });
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

    // verbose logging
    if (key.name == 'v') {
      VERBOSE = !VERBOSE;
      console.log(VERBOSE ? 'Set to log verbosely'.yellow : 'Set to log quietly'.yellow, newLine);
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

// prompts for domain they want to use
function firstRun(cb) {
  var firstRun = BUILD_ONLY || CONFIG;

  log('first run?', firstRun)
  if (firstRun) {
    return cb();
  }

  console.log();
  askForUrlPreference(function(useFriendly) {
    CONFIG = { friendlyUrl: DEV_URL, useFriendly: useFriendly };
    openInBrowser();
    jf.writeFile(CONFIG_DIR, CONFIG);
    cb();
  });
}

// ask for preferred url and set /etc/hosts
function askForUrlPreference(cb) {
  // var promptly = require('promptly');
  var askCounter = 'Run on ' + DEV_URL + '?';

  // promptly.prompt(askCounter, {}, function(err, val) {
    var useFriendly = false; // val == 'y';
    if (useFriendly) hostile.set('127.0.0.1', DEV_URL)
    cb(useFriendly)
  // });
}


function getScriptTags(files, req) {
  return newLine +
    '<!-- FLINT JS -->' +
    newLine +
    [
      '<script src="/assets/flintjs/dist/flint.js"></script>',
      '<script id="__flintPackages" src="/packages/packages.js"></script>',
      '<script>_FLINT_WEBSOCKET_PORT = ' + wport() + '</script>',
      '<script src="/assets/flintjs/dist/devtools.js"></script>'
    ].join(newLine) +
    newLine +
    // devtools
    (
      devToolsDisabled(req) ? '' : [
        '<script src="/assets/flint-tools/tools.js"></script>',
        '<script>flintRun_tools("_flintdevtools", { app: "devTools" });</script>',
      ].join(newLine) || ''
    ) +
    newLine +
    // user files
    '<script>window.Flint = runFlint(window.renderToID || "_flintapp", { namespace: window, app: "userMain" });</script>' +
    newLine +
    assetScriptTags(files) +
    newLine +
    '<script>Flint.render()</script>' +
    '<!-- END FLINT JS -->' +
    newLine;
}

function assetScriptTags(scripts) {
  return scripts.map(function(file) {
    return '<script src="/assets/' + file + '"></script>';
  }).join(newLine);
}

function devToolsDisabled(req) {
  return CONFIG.tools === 'false' || req && req.query && req.query['!dev'];
}

function allowCrossDomain(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}

function runServer(cb) {
  var server = express();
  server.use(cors());
  server.use(allowCrossDomain)

  server.use('/assets', express.static('.flint/out'));
  server.use('/static', express.static('.flint/static'));
  server.use('/packages', express.static('.flint/deps'));
  server.use('/', express.static('.'));

  // local flint or installed flint
  // server.use('/assets/flint', express.static('~/flint/flint-js/dist'));
  server.use('/assets/flint', express.static('.flint/node_modules/flint-js/dist'));

  var modulesPath = p(__dirname, '..', 'node_modules');
  server.use('/assets/flint-tools', express.static(p(modulesPath, 'flint-tools', 'build', '_')));
  server.use('/assets/flintjs', express.static(p(modulesPath, 'flint-js')));

  server.get('*', function(req, res) {
    afterInitialBuild(function() {
      makeTemplate(req, function(template) {
        res.send(template);
      })
    })

    setTimeout(bridge.message.bind(this, 'view:locations', APP_VIEWS), 200)
  });

  function afterInitialBuild(cb) {
    if (HAS_RUN_INITIAL_BUILD) cb();
    else setTimeout(afterInitialBuild.bind(null, cb), 150);
  }

  function serverListen(port) {
    process.stdout.write("\nFlint app running on ".white)
    console.log(
      "http://%s".bold + newLine,
      host + (port && port !== 80 ? ':' + port : '')
    );

    ACTIVE_PORT = port
    if (cb) cb();
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
}

function makeTemplate(req, cb) {
  if (!TEMPLATE)
    TEMPLATE = fs.readFileSync(OPTS.dir + '/' + OPTS.template).toString();

  var files = []

  readdirp({ root: p(FLINT_DIR, 'out') },
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
        cb(TEMPLATE);
      }
      else
        cb(TEMPLATE.replace('<!-- SCRIPTS -->',
          '<div id="_flintdevtools"></div>'
          + newLine
          + getScriptTags(files, req)
        ));
    });
}

function log(verbose) {
  if (verbose && VERBOSE || !verbose)
    if (OPTS.debug || VERBOSE)
      console.log(Array.prototype.slice.call(arguments))
}

function unicodeToChar(text) {
  return !text ? '' : text.replace(/\\u[\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef]/g,
    function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

function writeFlowFile() {
  return
  mkdirp(path.join(TYPED_OUT_DIR), function() {
    fs.writeFileSync(path.join(TYPED_OUT_DIR, '.flowconfig'), '');
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

var flow = {
  check: debounce(flowCheck, 400)
}

function flowCheck(cb) {
  return
  console.log("running flow check")
  var flowCmd = 'flow check --json ' + path.normalize(APP_DIR) + '/.flint/typed';
  exec(flowCmd, function() {
    if (arguments[1]) {
      //console.log(arguments);
      var response = JSON.parse(arguments[1])
      var passed = response.passed
      var toFlint = {}
      if (!passed) {
        var msg = response.errors[0].message

        toFlint = {
          message: msg
                .map(function(m) { return m.descr })
                .join(" "),
          fileName: msg[0].path,
          loc: { col: msg[0].start, line: msg[0].line}
        }
      }
      cb(response.passed, toFlint)
    }
    else {
      cb(true, null)
    }
  })
}

function makeDependencyBundle(cb) {
  var pkg = require(FLINT_DIR + '/package.json');
  var deps = Object.keys(pkg.dependencies)
    .filter(function(name) { return name !== 'flintjs' });

  var requireString = deps.map(function(name) {
    return 'window.__flintPackages["' + name + '"] = require("'+ name +'");'
  }).join("\n");

  var DEP_DIR = p(FLINT_DIR, 'deps');
  var DEPS_FILE = p(DEP_DIR, 'deps.js');

  // make dep dir
  mkdirp(DEP_DIR, handleError(function() {
    writeDeps();
  }));

  function writeDeps() {
    fs.writeFile(DEPS_FILE, requireString, handleError(function() {
      bundleDeps();
    }))
  }

  function bundleDeps() {
    var b = browserify();
    b.add(DEPS_FILE)
    b.bundle(handleError(function(buf) {
      fs.writeFile(p(DEP_DIR, 'packages.js'), buf)
      if (cb) cb();
    }))
  }
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

module.exports = main;
