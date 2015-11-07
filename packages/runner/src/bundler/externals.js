import webpack from 'webpack'

import cache from '../cache'
import { installAll } from './install'
import { onInstalled } from './messages'
import { writeJSON, writeFile, rmdir } from '../lib/fns'
import getMatches from './lib/getMatches'
import log from '../lib/log'

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

const findExternalRequires = source =>
  findRequires(source).filter(x => x.charAt(0) != '.')

const depRequireString = (name, onto, pathname = '') => `
  try {
    Flint.${onto}["${name}"] = require("${pathname}${name}")
  }
  catch(e) {
    console.log('Error running package!')
    console.error(e)
  };
`

async function packExternals(file, out) {
  log('npm: pack')
  return new Promise((resolve, reject) => {
    webpack({
      entry: DEPS.depsJS,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        'react-dom': 'ReactDOM'
      },
      output: {
        filename: DEPS.packagesJS
      }
    }, async err => {
      if (err) {
        // undo written packages
        await rmdir(DEPS.depsJSON)
        console.log("Error bundling your packages:", err)
        return reject(err)
      }

      log('npm: pack: finished')
      resolve()
    })
  })
}

async function writeDeps(deps = []) {
  log('npm: writeDeps:', deps)
  await writeJSON(DEPS.depsJSON, { deps })
  const requireString = deps.map(name => {
    return depRequireString(name, 'packages')
  }).join('')
  await writeFile(DEPS.depsJS, requireString)
}

async function bundleExternals() {
  log('npm: bundleExternals')
  const installed = await readInstalled()
  await writeDeps(installed)
  await packExternals()
  onInstalled()
}

async function installExternals(file, source) {
  log('installExternals', file)

  const found = findExternalRequires(source)
  cache.setFileImports(file, found)
  installAll(found)
}
