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

function scriptTags(files) {
  return files
    .map(file => `<script src="/_/${file}" class="__flintScript"></script>`)
    .join(newLine)
}

function devToolsDisabled(req) {
  return OPTS.config && OPTS.config.tools === 'false' || req && req.query && req.query['!dev']
}

async function readScripts() {
  const dir = await readdir({ root: OPTS.outDir })
  const files = dir.files.filter(f => /\.jsf?$/.test(f.name)) // filter sourcemaps
  const hasFiles = files.length

  let paths = []

  // deterministic order
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

  return paths
}

async function getScripts({ disableTools }) {
  const files = await readScripts()

  return [
    disableTools ? '' : '<div id="_flintdevtools"></div>',
    newLine,
    '<!-- FLINT JS -->',
    '<script src="/__/react.dev.js"></script>',
    '<script src="/__/flint.dev.js"></script>',
    '<script>_FLINT_WEBSOCKET_PORT = ' + wport() + '</script>',
    '<script src="/__/devtools.dev.js"></script>',
    // devtools
    disableTools ? '' : [
      '<script src="/__/tools/tools.js"></script>',
      '<script>flintRun_tools("_flintdevtools", { app: "devTools" });</script>'
    ].join(newLine),
    // user files
    newLine,
    '<!-- APP -->',
    `<script>window.Flint = runFlint(window.renderToID || "_flintapp", { app: "${OPTS.name}" })</script>`,
    '<script src="/__/packages.js" id="__flintPackages"></script>',
    '<script src="/__/internals.js" id="__flintInternals"></script>',
    scriptTags(files),
    '<script>Flint.init()</script>',
    '<!-- END APP -->'
  ].join(newLine)
}

async function getStyles() {
  const dir = await readdir({ root: OPTS.styleDir })
  const names = dir.files.map(file => file.path).sort()
  return names
    .map(name => `<link rel="stylesheet" href="/__/styles/${name}" id="_flintV${name.replace('.css', '')}" />`)
    .join(newLine)
}

async function makeTemplate(req) {
  try {
    const templatePath = p(OPTS.dir, OPTS.template)
    const template = await readFile(templatePath)
    const disableTools = devToolsDisabled(req)
    const scripts = await getScripts({ disableTools })
    const styles = await getStyles()

    return template
      .replace('<!-- STYLES -->', styles)
      .replace('<!-- SCRIPTS -->', scripts)
  }
  catch(e) {
    handleError(e)
  }
}

export function run() {
  OPTS = opts.get()

  return new Promise((res, rej) => {
    var server = express()
    server.use(cors())
    server.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      next()
    })

    const staticOpts =  {
      redirect: false
    }

    // USER files
    // user js files at '/_/filename.js'
    server.use('/_', express.static('.flint/.internal/out'))
    // user non-js files
    server.use('/', express.static('.', staticOpts))
    // user static files...
    server.use('/_/static', express.static('.flint/static'))

    // INTERNAL files
    server.use('/__', express.static('.flint/.internal/deps'))
    server.use('/__/styles', express.static('.flint/.internal/styles'))
    // tools.js
    server.use('/__/tools', express.static(p(OPTS.modulesDir, 'flint-tools', 'build', '_')))
    // flint.js & react.js
    server.use('/__', express.static(p(OPTS.modulesDir, 'flint-js', 'dist')))

    server.get('*', function(req, res) {
      runAfterFirstBuildComplete(async function() {
        const template = await makeTemplate(req)
        res.send(template.replace(/\/static/g, '/_/static'))
      })
    })

    function runAfterFirstBuildComplete(cb) {
      if (OPTS.hasRunInitialBuild) cb()
      else setTimeout(runAfterFirstBuildComplete.bind(null, cb), 150)
    }

    function serverListen(port) {
      opts.set('port', port)
      opts.set('host', host)
      server.listen(port, host)
      res()
    }

    var host = 'localhost'
    var port = OPTS.port || OPTS.defaultPort

    // if no specified port, find open one
    if (!OPTS.port) {
      portfinder.basePort = port
      portfinder.getPort({ host: 'localhost' },
        handleError(serverListen)
      )
    }
    else {
      serverListen(port)
    }
  })
}

export function url() {
  const host = opts.get('host')
  const port = opts.get('port')
  return host + (port && port !== 80 ? ':' + port : '')
}

export default { run, url }