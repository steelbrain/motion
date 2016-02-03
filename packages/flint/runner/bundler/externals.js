import { webpack } from '../lib/requires'
import webpackConfig from './lib/webpackConfig'
import getWebpackErrors from './lib/getWebpackErrors'
import disk from '../disk'
import opts from '../opts'
import cache from '../cache'
import requireString from './lib/requireString'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { log, logError } from '../lib/fns'

export async function externals(opts = {}) {
  if (opts.doInstall) await installAll()
  await externalsPathsToIn()
  await packExternals()
  if (!opts.silent) onInstalled()
}

export async function installExternals(filePath, source) {
  const found = cache.getExternals(filePath)
  log.externals('installExternals', found)
  if (opts('hasRunInitialBuild')) installAll(found)
}

// read externals.path => write externals.in
async function externalsPathsToIn() {
  const fullpaths = await disk.externalsPaths.read()
  await disk.externalsIn.write((_, write) => write(requireString(fullpaths)))
}

async function packExternals() {
  log.externals('pack externals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('externals.js', {
      entry: opts('deps').externalsIn,
    })

    webpack()(conf, async (err, stats) => {
      logError(getWebpackErrors('externals', err, stats))
      resolve()
    })
  })
}