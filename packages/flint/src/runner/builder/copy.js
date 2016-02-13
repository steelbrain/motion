import { log, p, copy, writeFile, readFile, readdir, handleError } from '../lib/fns'
import opts from '../opts'
import flintjs from 'flint-js'

// todo gulpify alll the things

async function copyWithSourceMap(file, dest) {
  try { await copy(file, dest) }
  catch(e) { print("Couldn't copy", file) }
  try { await copy(file + '.map', dest + '.map') }
  catch(e) { handleError(e) }
}

export function flint() {
  const read = p(flintjs(), 'dist', 'flint.prod.js')
  const write = p(opts('buildDir'), '_', 'flint.prod.js')
  return copyWithSourceMap(read, write)
}

export function react() {
  const read = p(flintjs(), 'dist', 'react.prod.js')
  const write = p(opts('buildDir'), '_', 'react.prod.js')
  return copyWithSourceMap(read, write)
}

export default { flint, react }