import { _, p, log, rm, glob, readdir, handleError } from '../lib/fns'
import opts from '../opts'
import { SCRIPTS_GLOB } from './lib/helpers'
import { scripts, afterBuild } from './scripts'
import { styles } from './styles'
import { app } from './app'
import { assets } from './assets'

export async function init({ options, files }) {
  try {
    const inFiles = await glob(files)
    const _outFiles = await readdir(opts('outDir'))
    const outFiles = _outFiles
      .map(file => file.path)
      .filter(path => path.slice(-4) !== '.map')

    // cleanup out dir since last run
    const deleted = _.difference(outFiles, inFiles)
    const deletedPaths = deleted.map(f => p(opts('outDir'), f))
    await Promise.all(deletedPaths.map(f => rm(f)))
    log.gulp('deleted', deletedPaths)

    scripts({ inFiles, outFiles })
  }
  catch(e) {
    handleError(e)
  }
}

// listen to gulp events
let listeners = {}
export function event(name, cb) {
  listeners[name] = listeners[name] || []
  listeners[name].push(cb)
}
event.run = (name, file, data) => listeners[name] && listeners[name].forEach(cb => cb(file, data))


// exports

export default {
  init,
  scripts,
  afterBuild,
  assets,
  app,
  event,
  styles
}
