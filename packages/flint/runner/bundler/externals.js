import webpack from 'webpack'
import { Promise } from 'bluebird'
import webpackConfig from './lib/webpackConfig'
import handleWebpackErrors from './lib/handleWebpackErrors'
import disk from '../disk'
import opts from '../opts'
import cache from '../cache'
import depRequireString from './lib/depRequireString'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { log, path, writeJSON, writeFile } from '../lib/fns'
import getMatches from './lib/getMatches'

const LOG = 'externals'

const findRequires = source => getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []
const findExternalRequires = source => findRequires(source).filter(x => x.charAt(0) != '.')

export async function bundleExternals(opts = {}) {
  if (opts.doInstall) await installAll()
  await externalsPathsToIn()
  await packExternals()
  if (!opts.silent) onInstalled()
}

export async function installExternals(file, source) {
  const found = findExternalRequires(source)
  log(LOG, 'installExternals', file, 'found', found)

  cache.setFileImports(file, found)

  if (opts.get('build') || opts.get('hasRunInitialBuild'))
    installAll(found)
}

// read externals.path => write externals.in
async function externalsPathsToIn() {
  const fullpaths = await disk.externalsPaths.read()
  const requireString = fullpaths.map(name => depRequireString(name, 'packages')).join('')
  await disk.externalsIn.write((_, write) => write(requireString))
}

async function packExternals() {
  log(LOG, 'pack externals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('externals.js', {
      entry: opts.get('deps').externalsIn,
    })

    log(LOG, 'webpackConfig', conf)

    webpack(conf, (err, stats) => {
      handleWebpackErrors('externals', err, stats, resolve, reject)
    })
  })
}