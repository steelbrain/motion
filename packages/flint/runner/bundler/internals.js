import webpack from 'webpack'
import { onInternalInstalled } from './lib/messages'
import webpackConfig from './lib/webpackConfig'
import readInstalled from './lib/readInstalled'
import handleWebpackErrors from './lib/handleWebpackErrors'
import depRequireString from './lib/depRequireString'
import hasExports from '../lib/hasExports'
import bridge from '../bridge'
import cache from '../cache'
import opts from '../opts'
import log from '../lib/log'
import handleError from '../lib/handleError'
import { writeFile } from '../lib/fns'

const LOG = 'internals'

export async function bundleInternals() {
  try {
    log(LOG, 'bundleInternals')
    await writeInternalsIn()
    await packInternals()
    onInternalInstalled()
  }
  catch(e) {
    handleError(e)
  }
}

async function writeInternalsIn() {
  const files = cache.getExported()
  const requireString = `
    var packages = {
      ${files.map(f => depRequireString(f.replace(/\.js$/, ''), 'internals', './internal/')).join('')}
    }

    module.exports = packages
  `

  log(LOG, 'writeInternalsIn', requireString)
  await writeFile(opts.get('deps').internalsIn, requireString)
}

let runningBundle = null

// TODO: check this in babel to be more accurate
export async function checkInternals(file, source) {
  log(LOG, 'checkInternals', file)

  const isInternal = hasExports(source)
  cache.setIsInternal(file, isInternal)

  if (opts.get('hasRunInitialBuild') && isInternal && !runningBundle) {
    clearTimeout(runningBundle)
    runningBundle = setTimeout(async () => {
      await bundleInternals()
      runningBundle = null
    }, 100)
  }
}

// let internals use externals
export function webpackUserExternals() {
  const imports = cache.getImports()
  const externalsObj = imports.reduce((acc, cur) => {
    acc[cur] = `Flint.packages["${cur}"]`
    return acc
  }, {})

  return externalsObj
}

function packInternals() {
  log(LOG, 'packInternals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('internals.js', {
      entry: opts.get('deps').internalsIn,
      externals: webpackUserExternals()
    })

    webpack(conf, (err, stats) => {
      handleWebpackErrors('internals', err, stats, resolve, reject)
    })
  })
}
