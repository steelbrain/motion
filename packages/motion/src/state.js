/* @flow */

import { exists, readFile, writeJSON } from './fs'
import { getRandomNumber } from './helpers'
import type { Motion$State, Motion$StateConfig } from './types'

export default class State {
  state: Motion$State;
  config: Motion$StateConfig;
  stateFile: string;
  configFile: string;

  constructor(state: Motion$State, config: Motion$StateConfig, stateFile: string, configFile: string) {
    this.state = state
    this.config = config
    this.stateFile = stateFile
    this.configFile = configFile
  }
  get(): Motion$State {
    return this.state
  }
  getConfig(): Motion$StateConfig {
    return this.config
  }
  async write(): Promise {
    await writeJSON(this.stateFile, this.state, true)
    await writeJSON(this.configFile, this.config, true)
  }

  static async create(stateFile: string, configFile: string): Promise<State> {
    const stateFileContents = await exists(stateFile) ? (await readFile(stateFile, 'utf8')).trim() : null
    const configFileContents = await exists(configFile) ? (await readFile(configFile, 'utf8')).trim() : null
    let state = {
      running: false,
      process_id: process.pid,
      web_server_port: getRandomNumber(8090, 9500),
      npm_save: true
    }
    let config = {
      include_polyfills: false
    }
    if (stateFileContents) {
      try {
        state = Object.assign(JSON.parse(stateFileContents), state)
      } catch (_) {
        throw new Error(`Malformed state file at ${stateFile}`)
      }
    }
    if (configFileContents) {
      try {
        config = Object.assign(JSON.parse(configFileContents), config)
      } catch (_) {
        throw new Error(`Malformed state file at ${configFile}`)
      }
    }

    return new State(state, config, stateFile, configFile)
  }
}
