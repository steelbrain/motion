import { p, path } from '../lib/fns'
import gulp from '../gulp'
import bundler from '../bundler'
import copy from './copy'
import opts from '../opts'
import makeTemplate from './makeTemplate'
import { handleError } from '../lib/fns'

export default async function build({ bundle = true } = {}) {
  try {
    console.log(`\n  Building...`.dim)

    if (bundle) {
      await bundler.install()
      await bundler.internals()
    }

    makeTemplate()

    await *[
      gulp.app(),
      gulp.styles(),
      copy.flint(),
      copy.react(),
    ]

    console.log(`\n  Built! ⇢`.green.bold + `  cd ${buildDir()}`)
  }
  catch(e) {
    handleError(e)
  }
}

function buildDir() {
  return path.relative(opts('appDir'), opts('buildDir'))
}