import { p } from '../lib/fns'
import gulp from '../gulp'
import bundler from '../bundler'
import keys from '../keys'
import copy from './copy'
import makeTemplate from './makeTemplate'
import log from '../lib/log'

export default async function build() {
  log('Building extras, template...')
  makeTemplate()

  log('Building extras, bundler...')
  await *[
    bundler.install(),
    bundler.internals()
  ]

  log('Building extras, copy...')
  await *[
    copy.flint(),
    copy.react(),
    copy.app()
  ]

  console.log("\nDone! ⇢  .flint/build\n".green.bold)
}
