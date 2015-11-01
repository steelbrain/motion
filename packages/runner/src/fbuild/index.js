import { p } from '../lib/fns'
import { buildScripts } from '../index'
import gulp from '../gulp'
import keys from '../keys'
import copy from './copy'
import makeTemplate from './template'

export default async function build(running) {
  copy.assets()

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

  await *[
    copy.flint(),
    copy.react(),
    copy.app()
  ]
}
