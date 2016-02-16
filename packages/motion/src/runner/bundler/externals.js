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

    await packExternals()

    if (!opts.silent)
      onInstalled()
  }
}

function packExternals() {
  log.externals('pack externals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('externals.js', {
      entry: opts('deps').externalsIn,
    })

    webpack(conf, async (err, stats) => {
      logError(getWebpackErrors('externals', err, stats))
      resolve()
    })
  })
}


export async function installExternals(filePath) {
  const found = cache.getExternals(filePath)
  log.externals('installExternals', found)

  if (opts('hasRunInitialBuild'))
    await installAll(found)
}
