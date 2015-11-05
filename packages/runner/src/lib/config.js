import opts from '../opts'
import log from './log'
import wport from './wport'
import { readJSON, writeJSON } from './fns'

let OPTS

export async function readConfig() {
  return await readJSON(OPTS.configFile)
}

export async function _writeConfig(config) {
  return await writeJSON(OPTS.configFile, config, { spaces: 2 })
}

// prompts for domain they want to use
export async function writeConfig() {
  OPTS = opts.get()

  try {
    OPTS.config = await readJSON(OPTS.configFile)
    log('got config', CONFIG)
  }
  catch(e) {
    log('no config found, ok')
  }

  if (OPTS.build) return

  OPTS.config = { port: wport() }
  _writeConfig(OPTS.config)
  return true
}
