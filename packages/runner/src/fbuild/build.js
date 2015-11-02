import { p } from '../lib/fns'
import { buildScripts } from '../index'
import gulp from '../gulp'
import npm from '../npm'
import keys from '../keys'
import copy from './copy'
import makeTemplate from './template'

export default async function build(running) {
  // copy assets
  copy.assets()

  // build user files
  if (running) {
    await gulp.buildWhileRunning()
    makeTemplate()
    keys.stop()
  }
  else {
    gulp.buildScripts()
    await gulp.afterFirstBuild()
    makeTemplate()
  }

  // bundle npm / internals
  await *[
    npm.install(),
    npm.bundleInternals()
  ]

  // copy / concat js
  await *[
    copy.flint(),
    copy.react(),
    copy.app()
  ]

}
