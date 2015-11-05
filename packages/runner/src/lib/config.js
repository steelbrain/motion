import opts from '../opts'
import log from './log'
import handleError from './handleError'
import wport from './wport'
import { readJSON, writeJSON } from './fns'

let OPTS

export async function readConfig() {
  return await readJSON(OPTS.configFile)
}

// prompts for domain they want to use
export async function writeConfig(config) {
  if (!config) return console.error("Must provide a config to write")

  try {
    log('writing'.bold, config)
    return await writeJSON(OPTS.configFile, config, { spaces: 2 })
  }
  catch(e) {
    handleError(e)
  }
}

export async function initConfig() {
  OPTS = opts.get()

  const config = await readConfig()

  // first time
  if (!config) {
    OPTS.config = { port: wport() }
  }
}