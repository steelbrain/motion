import log from '../lib/log'
import cache from '../cache'
import webpack from 'webpack'

// TODO: check this in babel to be more accurate
async function checkInternals(file, source) {
  log('checkInternals', file)

  const isExporting = findExports(source)
  const alreadyExported = cache.isExported(file)
  log('checkInternals: found', isExporting, 'already', alreadyExported)

  cache.setExported(file, isExporting)

  // needs to rewrite internalsIn.js?
  if (!alreadyExported && isExporting || alreadyExported && !isExporting) {
    await writeInternalsIn()
  }

  if (isExporting)
    bundleInternals()
}

async function writeInternalsIn() {
  log('writeInternalsIn')
  const files = cache.getExported()
  if (!files.length) return

  const requireString = files.map(f =>
    depRequireString(f.replace(/\.js$/, ''), 'internals', './internal/')).join('')

  await writeFile(DEPS.internalsIn, requireString)
}

export async function bundleInternals() {
  await packInternals()
  bridge.message('internals:reload', {})
}

function packInternals() {
  log('packInternals')
  return new Promise((res, rej) => {
    webpack({
      entry: DEPS.internalsIn,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        'react-dom': 'ReactDOM'
      },
      output: {
        filename: DEPS.internalsOut
      }
    }, async err => {
      if (err) {
        console.error(err.stack)
        return rej(err)
      }

      log('npm: pack: finished')
      res()
    })
  })
}