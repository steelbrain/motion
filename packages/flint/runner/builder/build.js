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
    console.log()

    if (bundle) {
      await bundler.install()
      await bundler.internals()
    }

    makeTemplate()

    console.log('  Copying assets...'.dim)
    await *[
      gulp.bundleApp(),
      copy.assets(),
      copy.flint(),
      copy.react()
    ]

    console.log(`\n  Built! ⇢`.green.bold + `  cd .flint/build\n`)
  }
  catch(e) {
    handleError(e)
  }
}
