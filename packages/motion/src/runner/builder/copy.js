import { log, p, copy, writeFile, readFile, readdir, handleError } from '../lib/fns'
import opts from '../opts'
import client from 'motion-client'

// todo gulpify alll the things

async function copyWithSourceMap(file, dest) {
  try { await copy(file, dest) }
  catch(e) { print("Couldn't copy", file) }
  try { await copy(file + '.map', dest + '.map') }
  catch(e) { handleError(e) }
}

export function motion() {
  const read = p(client(), 'dist', 'motion.prod.js')
  const write = p(opts('buildDir'), '_', 'motion.prod.js')
  return copyWithSourceMap(read, write)
}

export function react() {
  const read = p(client(), 'dist', 'react.prod.js')
  const write = p(opts('buildDir'), '_', 'react.prod.js')
  return copyWithSourceMap(read, write)
}

export default { motion, react }