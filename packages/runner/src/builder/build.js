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
    if (!opts.get('hasRunInitialInstall'))
      setTimeout(build, 50)

    if (opts.get('hasRunInitialBuild'))
      await copy.assets()

    log('Building extras, template...')
    makeTemplate()

    log('Building extras, bundler...')
    await bundler.install()
    await bundler.internals()

    log('Building extras, copy...')
    await *[
      copy.flint(),
      copy.react(),
      copy.app()
    ]

    console.log("\nDone! ⇢  .flint/build\n".green.bold)
  }
  catch(e) {
    handleError(e)
  }
}
