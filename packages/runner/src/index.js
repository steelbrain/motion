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
import logError from './lib/logError'
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
process.on('uncaughtException', cleanExit)

let child

function cleanExit(e) {
  if (e) logError(e)

  child && child.send('EXIT') // this seems to be required

  setTimeout(() => {
    child &&  child.kill('SIGINT')
    process.exit(0)
  })
}

export function stop() { cleanExit() }
export function setChild(_child) { child = _child }

// RUN

export async function run(_opts = {}, isBuild) {
  try {
    console.log()
    const appDir = _opts.appDir || path.normalize(process.cwd());
    const OPTS = await opts.setAll({ ..._opts, appDir, isBuild })

    log.setLogging()
    log('opts', OPTS)

    // init, order important
    await clear.init() // ensure directories
    await internal.init() // ensure state
    await opts.serialize() // write out opts to state
    await cache.init() // ensure cache
    await bundler.init() // start bundler
    compiler('init', OPTS) // start compiler

    // cache watching
    watchDeletes()

    const previousFiles = await readdir({ root: OPTS.outDir })
    const previousOut = previousFiles
      .files
      .map(file => file.path)
      .filter(path => path.slice(-4) !== '.map')

    // pipeline
    let pre, post

    let build = async () => {
      gulp.buildScripts({ previousOut })
      await gulp.afterFirstBuild()
      await bundler.finishedInstalling()
    }

    if (OPTS.build) {
      pre = async () => {
        await bundler.remakeInstallDir(true)
        await clear.buildDir()
        copy.assets()
      }

      post = async () => {
        if (OPTS.watch)
          return gulp.watchForBuild()
        else
          await build()

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
    await build()
    await post()
  }
  catch(e) {
    if (!e.silent)
      handleError(e)
  }
}

export default { run, stop, setChild }
