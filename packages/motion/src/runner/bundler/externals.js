import webpack from './lib/webpack'
import webpackConfig from './lib/webpackConfig'
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
export async function writeExternals(opts = {}) {
  if (opts.force || disk.externalsPaths.hasChanged()) {
    const paths = await disk.externalsPaths.read()

    await disk.externalsIn.write((current, write) => {
      write(requireString(paths))
    })
  }
}

export function runExternals() {
  const config = webpackConfig('externals.js', {
    entry: opts('deps').externalsIn,
  })

  return webpack('externals', config, onInstalled)
}

export async function installExternals(filePath) {
  if (opts('hasRunInitialBuild'))
    await installAll(cache.getExternals(filePath))
}