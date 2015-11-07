import bridge from './bridge'
import compiler from './compiler'
import handleError from './lib/handleError'
import server from './server'
import bundler from './bundler'
import opts from './opts'
import log from './lib/log'
import { initConfig } from './lib/config'
import gulp from './gulp'
import cache from './cache'
import openInBrowser from './lib/openInBrowser'
import watchingMessage from './lib/watchingMessage'
import build from './builder/build'
import clear from './builder/clear'
import copy from './builder/copy'
import path from 'path'

async function waitForFirstBuild() {
  await gulp.afterFirstBuild()
  await bundler.finishedInstalling()
}

function welcome(action) {
  console.log(`${action} ${opts.get('name')}\n`.bold)
}

export default async function run(_opts = {}, isBuild) {
  try {
    console.log()
    const appDir = _opts.appDir || path.normalize(process.cwd());
    const OPTS = opts.setAll({ ..._opts, appDir, isBuild })

    log.setLogging()
    log('opts', OPTS)

    await bundler.init()
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)
    await initConfig()

    if (OPTS.build) {
      welcome(`Building`)
      await bundler.remakeInstallDir(true)
      await clear.buildDir()
      copy.assets()

      // run our pipeline once manually
      gulp.buildScripts()
      await waitForFirstBuild()

      if (OPTS.watch)
        gulp.watchForBuild()
      else {
        await build()
        process.exit()
      }
    }
    else {
      welcome(`Running`)
      await clear.outDir()
      await server.run()
      bridge.start()
      gulp.buildScripts()

      // wait for build
      await waitForFirstBuild()

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
