import webpack from 'webpack'
import { Promise } from 'bluebird'
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

export async function bundleExternals() {
  const fullpaths = await readFullPaths()
  log(LOG, 'bundleExternals', fullpaths)
  await packExternals()
  onInstalled()
}

export async function installExternals(file, source) {
  log(LOG, 'installExternals', file)

  const found = findExternalRequires(source)
  cache.setFileImports(file, found)
  installAll(found)
}

async function packExternals(file, out) {
  log(LOG, 'pack')
  return new Promise((resolve, reject) => {
    webpack({
      entry: opts.get('deps').externalsIn,
      externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        bluebird: '_bluebird',
      },
      output: {
        filename: opts.get('deps').externalsOut
      }
    }, async err => {
      if (err) {
        // undo written packages
        console.log("Error bundling your packages:", err)
        return reject(err)
      }

      log(LOG, 'pack: finished')
      resolve()
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