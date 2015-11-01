import opts from '../opts'
import log from './log'
import { readJSON, writeJSON } from './fns'

let OPTS

export function readConfig() {
  return readJSON(OPTS.configFile)
}

export function writeConfig(config) {
  writeJSON(OPTS.configFile, config, { spaces: 2 })
}

// prompts for domain they want to use
export async function firstRun() {
  OPTS = opts.get()

  try {
    OPTS.config = await readJSON(OPTS.configFile)
    log('got config', CONFIG)
  }
  catch(e) {
    log('no config found, ok')
  }

  const hasRunBefore = OPTS.build || OPTS.config
  log('first run hasRunBefore:', hasRunBefore)

  if (hasRunBefore)
    return false

  const useFriendly = await askForUrlPreference()

  OPTS.config = { friendlyUrl: OPTS.url, useFriendly: useFriendly }
  writeConfig(OPTS.config)
  return true
}