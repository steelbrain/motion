import express from 'express'
import cors from 'cors'
import portfinder from 'portfinder'
import flintjs from 'flint-js'
import flinttools from 'flint-tools'

import internal from './internal'
import { p, readFile, readdir, handleError } from './lib/fns'

const newLine = "\n"
let OPTS, PORT

export default function wport() {
  return 2283 + parseInt(PORT, 10)
}

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
    '<div id="_flintdevtools" class="_flintdevtools"></div>',
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
    '<script src="/__/externals.js" id="__flintExternals"></script>',
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
    .map(name => `<link rel="stylesheet" href="/__/styles/${name}" />`)
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

function run() {
  return new Promise((res, rej) => {
    var server = express({
      env: 'production'
    })

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
    server.use('/__/tools', express.static(p(flinttools(), 'build', '_')))
    // flint.js & react.js
    server.use('/__', express.static(p(flintjs(), 'dist')))

    server.get('*', function(req, res) {
      afterFirstBuild(async function() {
        const template = await makeTemplate(req)
        res.send(template.replace(/\/static/g, '/_/static'))
      })
    })

    function afterFirstBuild(cb) {
      if (OPTS.hasRunInitialBuild) cb()
      else setTimeout(() => afterFirstBuild(cb), 150)
    }

    function serverListen(port) {
      internal.setServerState()
      server.listen(port, host)
      process.send(JSON.stringify({ host, port }))
    }

    var host = 'localhost'
    let port = PORT = OPTS.port || OPTS.defaultPort

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

let ran = false

process.on('message', function(opts) {
  if (opts === 'EXIT')
    return process.exit(2)

  OPTS = JSON.parse(opts)

  if (ran) return

  ran = true
  run()
})