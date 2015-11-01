import bridge from './bridge'
import compiler from './compiler'
import handleError from './lib/handleError'
import build from './fbuild'
import server from './server'
import npm from './npm'
import opts from './opts'
import log from './lib/log'
import { firstRun, writeConfig, readConfig } from './lib/config'
import gulp from './gulp'
import cache from './cache'
import unicodeToChar from './lib/unicodeToChar'
import openInBrowser from './lib/openInBrowser'
import wport from './lib/wport'
import clear from './fbuild/clear'
import keys from './keys'
import path from 'path'

let writeWPort = socketPort =>
  readConfig().then(config =>
    writeConfig(Object.assign(config, { socketPort }))
  )

function watchingMessage() {
  const newLine = "\n"
  const userEditor = (process.env.VISUAL || process.env.EDITOR)

  keys.start()

  console.log(
    newLine +
    ' • O'.cyan.bold + 'pen        '.cyan +
      ' • V'.cyan.bold + 'erbose'.cyan + newLine +
    (userEditor
      ? (' • E'.cyan.bold + 'dit        '.cyan)
      : '               ') +
        ' • I'.cyan.bold + 'nstall (npm)'.cyan + newLine
    // ' • U'.blue.bold + 'pload'.blue + newLine
  )

  keys.resume()
}

export async function run(_opts, isBuild) {
  try {
    const appDir = path.normalize(process.cwd());
    const OPTS = opts.set({ ..._opts, appDir, isBuild })

    log.setLogging(OPTS)
    log('run', OPTS)

    npm.init(OPTS)
    cache.setBaseDir(OPTS.dir)
    compiler('init', OPTS)

    await firstRun()

    if (OPTS.build) {
      console.log(
        "\nBuilding %s to %s\n".bold.white,
        OPTS.name + '.js',
        path.normalize(OPTS.buildDir)
      )

      log('building...')
      await clear.buildDir()
      await build(false, afterFirstBuild)
      await npm.install()

      console.log(
        "\nBuild Complete! Check your .flint/build directory\n".green.bold
      )

      if (OPTS.watch)
        gulp.watch(SCRIPTS_GLOB, ['build'])
      else
        process.exit()
    }
    else {
      log('running...')
      await clear.outDir()
      await server()
      bridge.start(wport())
      writeWPort(wport())
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
