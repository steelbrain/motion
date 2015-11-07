import { p } from '../lib/fns'
import { buildScripts } from '../index'
import gulp from '../gulp'
import bundler from '../bundler'
import keys from '../keys'
import copy from './copy'
import makeTemplate from './template'
import log from '../lib/log'

export default async function build() {
  log('Building extras, template...')
  makeTemplate()

  log('Building extras, bundler...')
  await *[
    bundler.install(),
    bundler.bundleInternals()
  ]

  log('Building extras, copy...')
  await *[
    copy.flint(),
    copy.react(),
    copy.app()
  ]

  console.log("\nDone! ⇢  .flint/build\n".green.bold)
}
