import bridge from './bridge'
import compiler from './compiler'
import server from './server'
import bundler from './bundler'
import builder from './builder'
import opts from './opts'
import disk from './disk'
import gulp from './gulp'
import cache from './cache'
import keys from './keys'
import watchDeletes from './lib/watchDeletes'
import { logError, handleError, path, log } from './lib/fns'
import Autocomplete from './autocomplete'

// welcome to flint!

let started = false

export async function startup(_opts = {}) {
  if (started) return
  started = true

  console.log()

  // opts
  const appDir = _opts.appDir || path.normalize(process.cwd());
  const OPTS = await opts.setAll({ ..._opts, appDir })

  // log
  log.setLogging()
  log('opts', OPTS)

  // init, order important
  await disk.init() // reads versions and sets up readers/writers
  await builder.clear.init() // ensures internal directories set up
  await opts.serialize() // write out opts to state file
  await* [
    cache.init(),
    bundler.init()
  ]

  compiler('init', OPTS)
  watchDeletes()
}

let gulpStarted = false

async function gulpScripts(opts) {
  await gulp.init(opts)
  await gulp.afterBuild()
}

//
// flint build
//

export async function build(opts = {}) {
  try {
    await startup({ ...opts, build: true })
    await * [
      bundler.remakeInstallDir(),
      builder.clear.buildDir()
    ]
    await * [
      gulp.assets(),
      gulpScripts({ once: opts.once })
    ]
    await builder.build()
    if (opts.once) return
    console.log()
    process.exit()
  }
  catch(e) {
    handleError(e)
  }
}

function runAutocomplete(bridge) {
  const autocomplete = new Autocomplete()
  bridge.onMessage('editor:autocomplete', function(message) {
    const id = message.id
    try  {
      const suggestions = autocomplete.provideAutocomplete(message.text, message.position)
      bridge.broadcast('editor:autocomplete', {id, suggestions})
    } catch (_) {
      logError(_)
      bridge.broadcast('editor:autocomplete', {id, suggestions: []})
    }
  })
}

//
// flint run
//

export async function run(opts) {
  try {
    await startup(opts)
    if (opts.watch) gulp.assets()
    await server.run()
    runAutocomplete(bridge)
    bridge.activate()
    await gulpScripts()
    cache.serialize() // write out cache
    await bundler.all()
    if (opts.watch) await builder.build()
    keys.init()
  }
  catch(e) {
    handleError(e)
  }
}
