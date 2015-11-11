import webpack from 'webpack'
import { Promise } from 'bluebird'
import { onInternalInstalled } from './lib/messages'
import readInstalled from './lib/readInstalled'
import depRequireString from './lib/depRequireString'
import findExports from '../lib/findExports'
import bridge from '../bridge'
import cache from '../cache'
import opts from '../opts'
import log from '../lib/log'
import handleError from '../lib/handleError'
import { writeFile } from '../lib/fns'

export async function bundleInternals() {
  try {
    log('bundler', 'bundleInternals')
    await writeInternalsIn()
    await packInternals()
    onInternalInstalled()
  }
  catch(e) {
    handleError(e)
  }
}

async function writeInternalsIn() {
  log('bundler', 'writeInternalsIn')
  const files = cache.getExported()
  const requireString = files.map(f =>
    depRequireString(f.replace(/\.js$/, ''), 'internals', './internal/')).join('')

  await writeFile(opts.get('deps').internalsIn, requireString)
}

// TODO: check this in babel to be more accurate
export async function checkInternals(file, source) {
  log('bundler', 'checkInternals', file)

  const isExporting = findExports(source)
  const alreadyExported = cache.isExported(file)
  log('bundler', 'checkInternals: found', isExporting, 'already', alreadyExported)

  cache.setExported(file, isExporting)

  // needs to rewrite internalsIn.js?
  if (!alreadyExported && isExporting || alreadyExported && !isExporting) {
    await writeInternalsIn()
  }

  if (isExporting)
    bundleInternals()
}

function packInternals() {
  log('bundler', 'packInternals')
  return new Promise((res, rej) => {
    webpack({
      entry: opts.get('deps').internalsIn,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        'react-dom': 'ReactDOM'
      },
      output: {
        filename: opts.get('deps').internalsOut
      }
    }, async err => {
      if (err) {
        console.error(err.stack)
        return rej(err)
      }

      log('bundler', 'pack: finished')
      res()
    })
  })
}