import express from 'express'
import cors from 'cors'
import portfinder from 'portfinder'

import opts from './opts'
import bridge from './bridge'
import handleError from './lib/handleError'
import wport from './lib/wport'
import { p, readFile, readdir } from './lib/fns'

const newLine = "\n"
let OPTS

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
}

function assetScriptTags(scripts) {
  return scripts.map(function(file) {
    return '<script src="/_/' + file + '"></script>';
  }).join(newLine);
}

function devToolsDisabled(req) {
  return OPTS.config.tools === 'false' || req && req.query && req.query['!dev'];
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

async function makeTemplate(req, cb) {
  const templatePath = p(OPTS.dir, OPTS.template)
  const template = await readFile(templatePath)
  const dir = await readdir({ root: p(OPTS.flintDir, 'out') })
  const files = dir.files.filter(f => /\.jsf?$/.test(f.name)) // filter sourcemaps
  const hasFiles = files.length

  let paths = []

  if (hasFiles) {
    paths = files.map(file => file.path).sort()

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

export default function server() {
  OPTS = opts.get()

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

      // setTimeout(bridge.message.bind(this, 'view:locations', APP_VIEWS), 200)
    });

    function runAfterFirstBuildComplete(cb) {
      if (OPTS.hasRunInitialBuild) cb();
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
    var useFriendly = OPTS.config.useFriendly || false

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
