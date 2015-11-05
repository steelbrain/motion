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
import clear from './fbuild/clear'
import build from './fbuild/build'
import path from 'path'

export async function run(_opts, isBuild) {
  try {
    const appDir = path.normalize(process.cwd());
    const OPTS = opts.set({ ..._opts, appDir, isBuild })

    log.setLogging(OPTS)
    log('run', OPTS)

    npm.init(OPTS)
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)

    if (OPTS.build) {
      console.log(
        "\nBuilding %s to %s\n".bold.white,
        OPTS.name + '.js',
        path.normalize(OPTS.buildDir)
      )

      await clear.buildDir()

      log('building...')

      // run our pipeline once manually
      gulp.buildScripts()
      await gulp.afterFirstBuild()

      // build assets once manually
      await build()

      console.log("\nDone! ⇢  .flint/build\n".green.bold)

      if (OPTS.watch)
        gulp.watchForBuild()
      else
        process.exit()
    }
    else {
      log('running...')
      await clear.outDir()
      await server()
      await initConfig()
      bridge.start()
      gulp.buildScripts()
      await gulp.afterFirstBuild()
      await npm.install()
      openInBrowser()
      watchingMessage()
    }
  }
  catch(e) {
    if (!e.silent)
      handleError(e)
  }
}
