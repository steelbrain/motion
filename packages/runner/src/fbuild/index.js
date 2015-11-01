import { buildWhileRunning } from '../index'
import { p } from '../lib/fns'
import { buildScripts } from '../index'
import gulp from '../gulp'
import keys from '../keys'
import copy from './copy'
import makeTemplate from './template'

export default async function build(running) {
  copy.assets()

  await *[
    copy.flint(),
    copy.react(),
    copy.packages(),
    copy.internals()
  ]

  if (running) {
    await buildWhileRunning()
    makeTemplate()
    keys.stop()
  }
  else {
    gulp.buildScripts()
    await gulp.afterFirstBuild()
    makeTemplate()
  }
}
