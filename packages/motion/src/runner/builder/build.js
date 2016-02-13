import { p, path } from '../lib/fns'
import gulp from '../gulp'
import bundler from '../bundler'
import copy from './copy'
import opts from '../opts'
import makeTemplate from './makeTemplate'
import { handleError } from '../lib/fns'

export default async function build({ bundle = true } = {}) {
  try {
    print(`\n  Building...`.dim)

    if (bundle) {
      await bundler.install()
      await bundler.internals()
    }

    makeTemplate()

    await Promise.all([
      gulp.app(),
      gulp.styles(),
      copy.motion(),
      copy.react(),
    ])

    print(`\n  Built! ⇢`.green.bold + `  cd ${buildDir()}`)
  }
  catch(e) {
    handleError(e)
  }
}

function buildDir() {
  return path.relative(opts('appDir'), opts('buildDir'))
}
