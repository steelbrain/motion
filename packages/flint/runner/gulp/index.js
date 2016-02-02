import { _, p, rm, glob, readdir, opts, handleError } from '../lib/fns'
import writeStyle from '../lib/writeStyle'
import { buildScripts } from './scripts'

export async function init({ once = false } = {}) {
  try {
    writeStyle.init()

    // if manually running a once
    // if (once) {
    //   hasRunCurrentBuild = false
    // }

    if (!isBuilding()) {
      watchDeletes()
      superStream.init()
    }

    const inFiles = await glob(SCRIPTS_GLOB)
    const _outFiles = await readdir(OPTS.outDir)
    const outFiles = _outFiles
      .map(file => file.path)
      .filter(path => path.slice(-4) !== '.map')

    // cleanup out dir since last run
    const deleted = _.difference(outFiles, inFiles)
    const deletedPaths = deleted.map(f => p(opts('outDir'), f))
    await * deletedPaths.map(f => rm(f))
    log.gulp('deleted', deletedPaths)

    buildScripts({ inFiles, outFiles })
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