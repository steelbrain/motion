import webpack from 'webpack'
import { Promise } from 'bluebird'
import webpackConfig from './lib/webpackConfig'
import handleWebpackErrors from './lib/handleWebpackErrors'
import internal from '../internal'
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

// read in fullpaths
// write out require string
async function externalsPathsToIn() {
  const fullpaths = await internal.externalsPaths.read()
  const requireString = fullpaths.map(name => depRequireString(name, 'packages')).join('')
  console.log('requirestring', requireString)
  await internal.externals.write((_, write) => write(requireString))
}

async function packExternals() {
  log(LOG, 'pack')
  return new Promise((resolve, reject) => {
    const conf = webpackConfig({
      entry: opts.get('deps').externalsIn,
      output: {
        filename: opts.get('deps').externalsOut
      }
    })

    log(LOG, 'webpackConfig', conf)

    webpack(conf, (err, stats) => {
      handleWebpackErrors(err, stats, resolve, reject)
    })
  })
}