global.print = console.log.bind(console)

import express from 'express'
import cors from 'cors'
import portfinder from 'portfinder'
import client from 'motion-client'
import motiontools from 'motion-tools'

import { p, readFile, readdir, handleError } from './lib/fns'

const newLine = "\n"

let OPTS, PORT, CACHE

export default function wport() {
  return 2283 + parseInt(PORT, 10)
}

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
}

function devToolsDisabled(req) {
  return OPTS.config && OPTS.config.tools === 'false' || req && req.query && req.query['!dev']
}

async function getScripts({ disableTools }) {
  try {
    return [
      '<div id="_motiondevtools" class="_motiondevtools"></div>',
      newLine,
      '<!-- MOTION JS -->',
      '<script src="/__/react.dev.js"></script>',
      '<script src="/__/motion.dev.js"></script>',
      '<script>_MOTION_WEBSOCKET_PORT = ' + wport() + '</script>',
      '<script src="/__/devtools.dev.js"></script>',
`
  <script>
    var Motion = exports['motion']
    Motion.init()
  </script>
`,

      // devtools
      disableTools ? '' : [
        '<script src="/__/tools/externals.js"></script>',
        '<script src="/__/tools/motiontools.js"></script>',
`
  <script>
    Motion.run("motiontools", { node: "_motiondevtools" })
  </script>
`
      ].join(newLine),
      // user files
      newLine,
      '<!-- APP -->',
`
  <script>
    // set up for dev mode, essentially faking a closure on window
    Motion = Motion.run("${OPTS.saneName}")
  </script>
`,
      '<script src="/__/externals.js" id="__motionExternals"></script>',
      '<script src="/__/app.js" id="__motionInternals"></script>',
      '<script>Motion.start()</script>',
      '<!-- END APP -->'
    ].join(newLine)
  }
  catch(e) {
    handleError(e)
  }
}

const stylesheetLink = (name) => `<link rel="stylesheet" href="/__/${name}" />`

async function getPathsInDir(_dir) {
  const dir = await readdir(_dir)
  if (!dir || !dir.length) return []
  return dir.map(file => file.path).sort()
}

async function getStyles() {
  const styles = await getPathsInDir(OPTS.styleDir)
  return styles.map(p => stylesheetLink(`styles/${p}`)).join(newLine)
}

async function getExternalStyles() {
  try {
    const styles = await getPathsInDir(p(OPTS.deps.assetsDir, 'styles'))
    return styles.map(p => stylesheetLink(`externalStyles/${p}`)).join(newLine)
  }
  catch(e) {
    return []
  }
}

async function makeTemplate(req) {
  try {
    const templatePath = p(OPTS.appDir, OPTS.template)
    const template = await readFile(templatePath)
    const disableTools = devToolsDisabled(req)
    const scripts = await getScripts({ disableTools })
    const styles = await getStyles()
    const externalStyles = await getExternalStyles()

    return template
      .replace('<!-- STYLES -->', styles)
      .replace('<!-- EXTERNAL STYLES -->', externalStyles)
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
    // hot reload files at '/_/filename.js'
    server.use('/_', express.static('.motion/.internal/hot'))
    // user non-js files
    server.use('/', express.static('.', staticOpts))
    // user static files...
    server.use('/_/static', express.static('.motion/static'))

    // INTERNAL files
    server.use('/__', express.static('.motion/.internal/deps'))
    server.use('/__/styles', express.static('.motion/.internal/styles'))
    server.use('/__/externalStyles', express.static('.motion/.internal/deps/assets/styles'))

    // tools.js
    server.use('/__/tools', express.static(p(motiontools(), 'build', '_')))
    // motion.js & react.js
    server.use('/__', express.static(p(client(), 'dist')))

    server.get('*', function(req, res) {
      afterFirstBuild(async function() {
        try {
          const template = await makeTemplate(req)
          res.send(template.replace(/\/static/g, '/_/static'))
        }
        catch(e) {
          print(e, e.stack)
        }
      })
    })

    function afterFirstBuild(cb) {
      if (OPTS.hasRunInitialBuild) cb()
      else setTimeout(() => afterFirstBuild(cb), 150)
    }

    function serverListen(port) {
      PORT = port
      server.listen(port, host)
      process.send(JSON.stringify({ host, port }))
    }

    const host = OPTS.config.host || 'localhost'
    const port = OPTS.config.port || OPTS.defaultPort

    // if no specified port, find open one
    if (!OPTS.config.port) {
      portfinder.basePort = port
      portfinder.getPort({ host },
        handleError(serverListen)
      )
    }
    else {
      serverListen(port)
    }
  })
}

let ran = false

process.on('message', function(_msg) {
  if (_msg === 'EXIT')
    return process.exit(2)

  let msg = JSON.parse(_msg)

  switch(msg.type) {
    case 'opts':
      OPTS = msg.data
      break
    case 'cache':
      CACHE = msg.data
      break
  }

  if (ran) return

  ran = true
  run()
})
