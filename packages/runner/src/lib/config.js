import opts from '../opts'
import log from './log'
import wport from './wport'
import { readJSON, writeJSON } from './fns'

let OPTS

export async function readConfig() {
  return await readJSON(OPTS.configFile)
}

export async function writeConfig(config) {
  return await writeJSON(OPTS.configFile, config, { spaces: 2 })
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

  writePort()

  if (hasRunBefore)
    return false

  const useFriendly = false //await askForUrlPreference()

  OPTS.config = { friendlyUrl: OPTS.url, useFriendly: useFriendly }
  writeConfig(OPTS.config)
  return true
}

async function writePort() {
  const config = OPTS.config

  if (!OPTS.build)
    return await writeConfig(Object.assign({}, config, { socketPort: wport() }))
}