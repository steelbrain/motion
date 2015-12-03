import webpack from 'webpack'
import { Promise } from 'bluebird'
import webpackConfig from './lib/webpackConfig'
import handleWebpackErrors from './lib/handleWebpackErrors'
import readFullPaths from './lib/readFullPaths'
import depRequireString from './lib/depRequireString'
import opts from '../opts'
import cache from '../cache'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { writeJSON, writeFile } from '../lib/fns'
import getMatches from './lib/getMatches'
import log from '../lib/log'

const LOG = 'externals'

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

const findExternalRequires = source =>
  findRequires(source).filter(x => x.charAt(0) != '.')

export async function bundleExternals(opts = {}) {
  if (opts.doInstall)
    await installAll()

  const fullpaths = await readFullPaths()
  await writeFullPaths(fullpaths)
  log(LOG, 'bundleExternals', fullpaths)
  await packExternals()

  if (!opts.silent)
    onInstalled()
}

export async function installExternals(file, source) {
  const found = findExternalRequires(source)
  log(LOG, 'installExternals', file, 'found', found)

  cache.setFileImports(file, found)

  if (opts.get('build') || opts.get('hasRunInitialBuild'))
    installAll(found)
}

async function packExternals() {
  log(LOG, 'pack')
  return new Promise((resolve, reject) => {
    const conf = Object.assign(webpackConfig(), {
      entry: opts.get('deps').externalsIn,
      output: {
        filename: opts.get('deps').externalsOut
      }
    })

    log(LOG, 'webpackConfig', conf)

    webpack(conf, async (err, stats) => {
      handleWebpackErrors(err, stats, resolve, reject)
    })
  })
}

async function writeFullPaths(deps = []) {
  log(LOG, 'writeFullPaths:', deps)
  const requireString = deps.map(name => {
    return depRequireString(name, 'packages')
  }).join('')
  await writeFile(opts.get('deps').externalsIn, requireString)
}