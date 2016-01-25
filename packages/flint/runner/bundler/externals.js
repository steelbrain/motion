import { webpack } from '../lib/require'
import webpackConfig from './lib/webpackConfig'
import handleWebpackErrors from './lib/handleWebpackErrors'
import disk from '../disk'
import opts from '../opts'
import cache from '../cache'
import requireString from './lib/requireString'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { log, path, writeJSON, writeFile } from '../lib/fns'

const LOG = 'externals'

export async function bundleExternals(opts = {}) {
  if (opts.doInstall) await installAll()
  await externalsPathsToIn()
  await packExternals()
  if (!opts.silent) onInstalled()
}

export async function installExternals(filePath, source) {
  const found = cache.getExternals(filePath)
  log(LOG, 'installExternals', filePath, 'found', found)
  if (opts('hasRunInitialBuild')) installAll(found)
}

// read externals.path => write externals.in
async function externalsPathsToIn() {
  const fullpaths = await disk.externalsPaths.read()
  await disk.externalsIn.write((_, write) => write(requireString(fullpaths)))
}

async function packExternals() {
  log(LOG, 'pack externals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('externals.js', {
      entry: opts('deps').externalsIn,
    })

    webpack()(conf, (err, stats) => {
      handleWebpackErrors('externals', err, stats, resolve, reject)
    })
  })
}