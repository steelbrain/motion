import bridge from './bridge'
import server from './server'
import bundler from './bundler'
import builder from './builder'
import Webpack from './webpack'
import opts from './opts'
import disk from './disk'
import Gulp from './gulp'
import Cache from './cache'
import keys from './keys'
import watchDeletes from './lib/watchDeletes'
import { logError, handleError, path, log } from './lib/fns'
import Editor from './editor'

// welcome to motion!

let started = false

export async function startup(options = {}) {
  started = true
  if (process.env.startedat) print('startup time: ', Date.now() - process.env.startedat)

  print()

  // order important!
  await opts.init(options)
  log.setLogging()
  await disk.init() // reads versions and sets up readers/writers
  await builder.clear.init() // ensures internal directories set up
  await Promise.all([
    opts.serialize(), // write out opts to state file
    Cache.init(),
    bundler.init()
  ])

  watchDeletes()
}

async function scripts(options) {
  const webpack = new Webpack()
  let { files, info } = await webpack.bundleApp()

  Cache.setFiles(info)
  await Gulp.init({ options, files })
  await Gulp.afterBuild()
}

export async function build(options = {}) {
  try {
    if (!started)
      await startup({ ...options, build: true })

    await Promise.all([
      bundler.remakeInstallDir(),
      builder.clear.buildDir()
    ])
    await Promise.all([
      Gulp.assets(),
      scripts({ once: options.once })
    ])
    await bundler.all()
    await builder.build()
    if (options.once) return
    print()
    process.exit()
  }
  catch(e) {
    handleError(e)
  }
}

export async function run(options) {
  try {
    await startup(options)
    if (options.watch)
      Gulp.assets()
    await server.run()
    await activateBridge()
    activateEditor(bridge)
    await scripts()
    Cache.serialize() // write out cache
    await bundler.all()
    if (options.watch) await builder.build()
    keys.init()
  }
  catch(e) {
    handleError(e)
  }
}

function activateEditor() {
  const editor = new Editor()
  editor.activate(bridge)
}

async function activateBridge() {
  await bridge.activate()
  bridge.onDidReceiveMessage('broadcast:editor', function(message) {
    bridge.broadcast('broadcast:editor', message)
  })
}
