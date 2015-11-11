import webpack from 'webpack'
import { Promise } from 'bluebird'
import readInstalled from './lib/readInstalled'
import depRequireString from './lib/depRequireString'
import opts from '../opts'
import cache from '../cache'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { writeJSON, writeFile, rmdir } from '../lib/fns'
import getMatches from './lib/getMatches'
import log from '../lib/log'

const LOG = 'externals'

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

const findExternalRequires = source =>
  findRequires(source).filter(x => x.charAt(0) != '.')

export async function bundleExternals() {
  const installed = await readInstalled()
  log(LOG, 'bundleExternals', installed)
  await writeDeps(installed)
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
      entry: opts.get('deps').depsJS,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        'react-dom': 'ReactDOM'
      },
      output: {
        filename: opts.get('deps').packagesJS
      }
    }, async err => {
      if (err) {
        // undo written packages
        await rmdir(opts.get('deps').depsJSON)
        console.log("Error bundling your packages:", err)
        return reject(err)
      }

      log(LOG, 'pack: finished')
      resolve()
    })
  })
}

async function writeDeps(deps = []) {
  log(LOG, 'writeDeps:', deps)
  await writeJSON(opts.get('deps').depsJSON, { deps })
  const requireString = deps.map(name => {
    return depRequireString(name, 'packages')
  }).join('')
  await writeFile(opts.get('deps').depsJS, requireString)
}