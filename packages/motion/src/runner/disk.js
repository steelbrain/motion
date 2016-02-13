import opts from './opts'
import wport from './lib/wport'
import { p, handleError, log, readJSON, writeJSON } from './lib/fns'
import createWriter from './lib/createWriter'

export async function init() {
  await createWriters()
}

// TODO ugly
let writers = {
  externalsPaths: {
    read: () => writers.pathsWriter.read(),
    write: (a) => writers.pathsWriter.write(a),
    hasChanged: () => writers.pathsWriter.hasChanged()
  },

  externalsIn: {
    read: () => writers.externalsWriter.read(),
    write: (a) => writers.externalsWriter.write(a),
    hasChanged: () => writers.externalsWriter.hasChanged()
  },

  internalsIn: {
    read: () => writers.internalsWriter.read(),
    write: (a) => writers.internalsWriter.write(a),
    hasChanged: () => writers.internalsWriter.hasChanged()
  },

  state: {
    read: () => writers.stateWriter.read(),
    write: (a) => writers.stateWriter.write(a),
    hasChanged: () => writers.stateWriter.hasChanged()
  },

  packageJSON: {
    read: () => writers.package.read(),
    write: (a) => writers.package.write(a),
    hasChanged: () => writers.package.hasChanged()
  }
}

async function createWriters() {
  writers.package = await createWriter(p(opts('motionDir'), 'package.json'), {
    debug: 'packageJSON',
    json: true,
    defaultValue: {}
  })

  writers.stateWriter = await createWriter(opts('stateFile'), {
    debug: 'state',
    json: true,
    defaultValue: {}
  })

  writers.pathsWriter = await createWriter(opts('deps').externalsPaths, {
    debug: 'externalsPaths',
    json: true,
    defaultValue: []
  })

  writers.externalsWriter = await createWriter(opts('deps').externalsIn, {
    debug: 'externals'
  })

  writers.internalsWriter = await createWriter(opts('deps').internalsIn, {
    debug: 'internals'
  })
}

export async function writeServerState() {
  try {
    await writers.state.write((state, write) => {
      state.port = opts('port')
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