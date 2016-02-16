import webpack from 'webpack'
import webpackConfig from './lib/webpackConfig'
import getWebpackErrors from './lib/getWebpackErrors'
import disk from '../disk'
import opts from '../opts'
import cache from '../cache'
import requireString from './lib/requireString'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { log, logError } from '../lib/fns'

// EXTERNALS
//    check updated
//      => write paths to disk
//      => pack with webpack
export async function externals(opts = {}) {
  if (opts.doInstall)
    await installAll()

  if (opts.force || disk.externalsPaths.hasChanged()) {
    const paths = await disk.externalsPaths.read()

    await disk.externalsIn.write((current, write) => {
      write(requireString(paths))
    })
  }
}

export function runExternals() {
  const bundler = webpack(webpackConfig('externals.js', {
    entry: opts('deps').externalsIn,
  }))

  const mode = !opts('build') ? 'watch' : 'run'

  bundler[mode]({}, (e, stats) => {
    log.externals('ran webpack externals')
    const err = getWebpackErrors('externals', e, stats)

    if (err) logError(err)
    else onInstalled()
  })
}

export async function installExternals(filePath) {
  const found = cache.getExternals(filePath)
  log.externals('installExternals', found)

  if (opts('hasRunInitialBuild'))
    await installAll(found)
}
