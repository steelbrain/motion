import bridge from './bridge'
import compiler from './compiler'
import handleError from './lib/handleError'
import server from './server'
import npm from './npm'
import opts from './opts'
import log from './lib/log'
import { initConfig } from './lib/config'
import gulp from './gulp'
import cache from './cache'
import openInBrowser from './lib/openInBrowser'
import watchingMessage from './lib/watchingMessage'
import build from './fbuild/build'
import clear from './fbuild/clear'
import copy from './fbuild/copy'
import path from 'path'

async function waitForFirstBuild() {
  await gulp.afterFirstBuild()
  await npm.finishedInstalling()
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

    npm.init(OPTS)
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)
    await initConfig()

    if (OPTS.build) {
      welcome(`Building`)
      // await npm.remakeInstallDir(true)
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
