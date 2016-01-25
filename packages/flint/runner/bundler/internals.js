import { webpack } from '../lib/require'
import { onInternalInstalled } from './lib/messages'
import webpackConfig from './lib/webpackConfig'
import { readInstalled } from './lib/readInstalled'
import handleWebpackErrors from './lib/handleWebpackErrors'
import requireString from './lib/requireString'
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
  await writeFile(opts('deps').internalsIn, requireString(files, './internal/'))
}

let runningBundle = null

// TODO: check this in babel to be more accurate
export async function checkInternals(file, source) {
  const isInternal = hasExports(source)
  cache.setIsInternal(file, isInternal)

  // not on build
  if (opts('hasRunInitialBuild') && isInternal && !runningBundle) {
    clearTimeout(runningBundle)
    runningBundle = setTimeout(async () => {
      await bundleInternals()
      runningBundle = null
    }, 100)
  }
}

// let internals use externals
export function webpackUserExternals() {
  const imports = cache.getExternals()
  const externalsObj = imports.reduce((acc, cur) => {
    acc[cur] = cur
    return acc
  }, {})

  return externalsObj
}

function packInternals() {
  log(LOG, 'packInternals')

  return new Promise((resolve, reject) => {
    const conf = webpackConfig('internals.js', {
      entry: opts('deps').internalsIn,
      externals: webpackUserExternals()
    })

    webpack()(conf, (err, stats) => {
      handleWebpackErrors('internals', err, stats, resolve, reject)
    })
  })
}
