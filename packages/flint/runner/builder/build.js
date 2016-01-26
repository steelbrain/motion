import { p } from '../lib/fns'
import gulp from '../gulp'
import bundler from '../bundler'
import keys from '../keys'
import copy from './copy'
import opts from '../opts'
import makeTemplate from './makeTemplate'
import { log, handleError } from '../lib/fns'

let hasCopiedBasics = false

export default async function build({ bundle = true } = {}) {
  try {
    log('Building...')
    console.log()

    if (bundle) {
      await bundler.install()
      await bundler.internals()
    }

    log('Building extras, template...')
    makeTemplate()

    if (opts('buildWatch') && hasCopiedBasics) {
      gulp.bundleApp()
    }
    else {
      console.log('  Copying assets...'.dim)
      await *[
        copy.assets(),
        copy.flint(),
        copy.react(),
        gulp.bundleApp()
      ]

      hasCopiedBasics = true
    }

    console.log(`\n  Built! ⇢`.green.bold + `  cd .flint/build\n`)
  }
  catch(e) {
    handleError(e)
  }
}
