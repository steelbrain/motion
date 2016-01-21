import { p } from '../lib/fns'
import gulp from '../gulp'
import bundler from '../bundler'
import keys from '../keys'
import copy from './copy'
import opts from '../opts'
import makeTemplate from './makeTemplate'
import { log, handleError } from '../lib/fns'

export default async function build() {
  try {
    log('Building extras, bundler...')
    await bundler.install()
    await bundler.internals()

    log('Building extras, template...')
    makeTemplate()

    log('Building app...')
    await *[
      copy.assets(),
      copy.flint(),
      copy.react(),
      gulp.bundleApp()
    ]

    console.log(`\n  Done! ⇢`.green.bold + `  .flint/build\n`)
  }
  catch(e) {
    handleError(e)
  }
}
