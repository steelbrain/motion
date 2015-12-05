import webpack from 'webpack'
import { Promise } from 'bluebird'
import { onInternalInstalled } from './lib/messages'
import webpackConfig from './lib/webpackConfig'
import readInstalled from './lib/readInstalled'
import handleWebpackErrors from './lib/handleWebpackErrors'
import depRequireString from './lib/depRequireString'
import findExports from '../lib/findExports'
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
  log(LOG, 'writeInternalsIn')
  const files = cache.getExported()
  const requireString = files.map(f =>
    depRequireString(f.replace(/\.js$/, ''), 'internals', './internal/')).join('')

  await writeFile(opts.get('deps').internalsIn, requireString)
}

// TODO: check this in babel to be more accurate
export async function checkInternals(file, source) {
  log(LOG, 'checkInternals', file)

  const isExporting = findExports(source)
  const alreadyExported = cache.isExported(file)
  log(LOG, 'checkInternals: found', isExporting, 'already', alreadyExported)

  cache.setIsExported(file, isExporting)

  // needs to rewrite internalsIn.js?
  if (!alreadyExported && isExporting || alreadyExported && !isExporting) {
    await writeInternalsIn()
  }

  if (isExporting)
    bundleInternals()
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
    const conf = webpackConfig({
      entry: opts.get('deps').internalsIn,
      externals: webpackUserExternals(),
      output: {
        filename: opts.get('deps').internalsOut
      }
    })

    webpack(conf, (err, stats) => {
      handleWebpackErrors(err, stats, resolve, reject)
    })
  })
}
