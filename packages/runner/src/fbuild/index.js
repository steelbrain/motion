import { buildWhileRunning } from '../index'
import { p } from '../lib/fns'
import { buildScripts } from '../index'
import keys from '../keys'
import copy from './copy'
import makeTemplate from './template'

export default async function build(running, afterFirstBuild) {
  copy.assets()

  await *[
    copy.flint(),
    copy.react(),
    copy.packages()
  ]

  if (running) {
    await buildWhileRunning()
    makeTemplate()
    keys.stop()
  }
  else {
    buildScripts()
    await afterFirstBuild()
    makeTemplate()
  }
}
