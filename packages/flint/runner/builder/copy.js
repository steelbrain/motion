import { log, p, copy, writeFile, readFile, readdir, globCopy, handleError } from '../lib/fns'
import opts from '../opts'
import flintjs from 'flint-js'

async function copyWithSourceMap(file, dest) {
  try { await copy(file, dest) }
  catch(e) { console.log("Couldn't copy", file) }
  try { await copy(file + '.map', dest + '.map') }
  catch(e) { handleError(e) }
}

export function flint() {
  var read = p(flintjs(), 'dist', 'flint.prod.js');
  var write = p(opts('buildDir'), '_', 'flint.prod.js');
  return copyWithSourceMap(read, write)
}

export function react() {
  var read = p(flintjs(), 'dist', 'react.prod.js');
  var write = p(opts('buildDir'), '_', 'react.prod.js');
  return copyWithSourceMap(read, write)
}

export async function styles() {
  try {
    let source = ''

    try {
      const files = await readdir(opts('styleDir'))
      const sources = await* files.map(async file => await readFile(file.fullPath))
      source = sources.join("\n\n")
    }
    catch(e) {
      // no styles, thats ok
    }

    await writeFile(opts('styleOutDir'), source)
  }
  catch(e) {
    handleError(e)
  }
}

export async function assets() {
  // copy .flint/statics and assets in app dir
  await* [
    globCopy(['*', '**/*'], p(opts('buildDir'), '_', 'static'), { cwd: '.flint/static' }),
    globCopy(['*', '**/*', '!**/*.js' ], opts('buildDir'))
  ]
}

export default { flint, react, assets, styles }