import opts from './opts'
import wport from './lib/wport'
import { handleError, log, readJSON, writeJSON } from './lib/fns'
import createWriter from './lib/createWriter'

export async function init() {
  await createWriters()
  await ensureConfigFile()
}

let writers = {
  externalsPaths: {
    read: () => writers.pathsWriter.read(),
    write: (a) => writers.pathsWriter.write(a)
  },

  externalsIn: {
    read: () => writers.externalsWriter.read(),
    write: (a) => writers.externalsWriter.write(a)
  },

  state: {
    read: () => writers.stateWriter.read(),
    write: (a) => writers.stateWriter.write(a),
  }
}

async function createWriters() {
  writers.stateWriter = await createWriter(opts.get('stateFile'), { debug: 'writeState', json: true })
  writers.pathsWriter = await createWriter(opts.get('deps').externalsPaths, { debug: 'writeExternalsPaths', json: true })
  writers.externalsWriter = await createWriter(opts.get('deps').externalsIn, { debug: 'writeExternals' })
}

async function ensureConfigFile() {
  try {
    let config = await readJSON(opts.get('configFile'))
    opts.set('config', config)
  }
  catch(e) {
    // write empty config on error
    await writeJSON(opts.get('configFile'), {})
  }
}

export async function writeServerState() {
  try {
    await writers.state.write((state, write) => {
      state.port = opts.get('port')
      state.wport = wport()
      write(state)
    })
  }
  catch(e) {
    handleError(e)
  }
}

export default {
  init,
  ...writers,
  writeServerState
}