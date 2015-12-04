import bridge from './bridge'
import compiler from './compiler'
import handleError from './lib/handleError'
import server from './server'
import bundler from './bundler'
import opts from './opts'
import log from './lib/log'
import internal from './internal'
import gulp from './gulp'
import cache from './cache'
import openInBrowser from './lib/openInBrowser'
import watchingMessage from './lib/watchingMessage'
import build from './builder/build'
import clear from './builder/clear'
import copy from './builder/copy'
import watchDeletes from './lib/watchDeletes'
import { mkdir, readdir } from './lib/fns'
import path from 'path'



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


// STOP

process.on('SIGINT', cleanExit)
process.on('SIGTERM', cleanExit)

let child

function cleanExit() {
  child && child.send('EXIT') // this seems to be required

  setTimeout(() => {
    child &&  child.kill('SIGINT')
    process.exit(0)
  })
}

export function stop() { cleanExit() }
export function setChild(_child) { child = _child }

// RUN

async function waitForFirstBuild() {
  await gulp.afterFirstBuild()
  await bundler.finishedInstalling()
}

export async function run(_opts = {}, isBuild) {
  try {
    console.log()
    const appDir = _opts.appDir || path.normalize(process.cwd());
    const OPTS = opts.setAll({ ..._opts, appDir, isBuild })

    log.setLogging()
    log('opts', OPTS)

    // ensure dirs
    await clear.styles()
    await clear.outDir()

    // init
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)
    await bundler.init()
    await internal.init()

    // cache watching
    watchDeletes()

    const previousOut = await readdir({ root: OPTS.outDir })

    if (OPTS.build) {
      await bundler.remakeInstallDir(true)
      await clear.buildDir()
      copy.assets()

      // run our pipeline once manually
      gulp.buildScripts(previousOut)
      await waitForFirstBuild()

      if (OPTS.watch)
        return gulp.watchForBuild()
      else
        await build()

      process.exit()
    }
    else {
      await clear.outDir()
      await server.run()
      bridge.start()
      gulp.buildScripts(previousOut)

      // wait for build
      await waitForFirstBuild()

      // ensure we have clean packages before open
      await bundler.externals({ doInstall: true })
      await bundler.uninstall()

      console.log(`\nReady ⇢ ${server.url()}\n`.bold.green)

      watchingMessage()
      // openInBrowser()
    }

    return opts.get()
  }
  catch(e) {
    if (!e.silent)
      handleError(e)
  }
}

export default { run, stop, setChild }