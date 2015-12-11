import bridge from './bridge'
import compiler from './compiler'
import server from './server'
import bundler from './bundler'
import builder from './builder'
import opts from './opts'
import internal from './internal'
import gulp from './gulp'
import cache from './cache'
import watchingMessage from './lib/watchingMessage'
import watchDeletes from './lib/watchDeletes'
import { logError, handleError, path, log } from './lib/fns'

// DONT RELEASE ME!
// import memwatch from 'memwatch-next'
// import heapdump from 'heapdump'
// memwatch.on('leak', function(info) {
//  console.error(info)
//  var file = '/tmp/myapp-' + process.pid + '-' + Date.now() + '.heapsnapshot'
//  heapdump.writeSnapshot(file, function(err){
//    if (err) console.error(err)
//    else console.error('Wrote snapshot: ' + file)
//   })
// })
// DONT RELEASE ME!

// RUN

export async function run(_opts = {}, isBuild) {
  try {
    console.log()
    const appDir = _opts.appDir || path.normalize(process.cwd());
    const OPTS = await opts.setAll({ ..._opts, appDir, isBuild })

    log.setLogging()
    log('opts', OPTS)

    // init, order important
    await builder.clear.init() // ensure directories
    await internal.init() // ensure state
    await opts.serialize() // write out opts to state
    await cache.init() // ensure cache
    await bundler.init() // start bundler
    compiler('init', OPTS) // start compiler
    watchDeletes()

    // pipeline
    let pre, post

    if (OPTS.build) {
      pre = async () => {
        await bundler.remakeInstallDir(true)
        await builder.clear.buildDir()
        builder.copy.assets()
      }

      post = async () => {
        if (OPTS.watch) return gulp.watchForBuild()
        await builder.build()
        process.exit()
      }
    }
    else {
      pre = async () => {
        await server.run()
        bridge.start()
      }

      post = async () => {
        // write out cache
        cache.serialize()
        // ensure we have clean packages before open
        await bundler.externals({ doInstall: true })
        await bundler.uninstall()
        console.log(`\nReady ⇢ ${server.url()}\n`.bold.green)
        watchingMessage()
      }
    }

    // run!
    await pre()
    await gulp.init()
    await gulp.afterFirstBuild()
    await post()
  }
  catch(e) {
    if (!e.silent) handleError(e)
  }
}

export default { run }
