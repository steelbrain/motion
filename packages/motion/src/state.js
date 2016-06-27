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
    let state = {
      running: false,
      process_id: process.pid,
      web_server_port: getRandomNumber(8090, 9500),
      npm_save: true
    }
    let config = {
      include_polyfills: false
    }
    if (await exists(stateFile)) {
      const stateFileContents = (await readFile(stateFile, 'utf8')).trim()
      try {
        state = Object.assign(state, JSON.parse(stateFileContents))
      } catch (_) {
        throw new Error(`Malformed state file at ${stateFile}`)
      }
    }
    if (await exists(configFile)) {
      const configFileContents = (await readFile(configFile, 'utf8')).trim()
      try {
        config = Object.assign(config, JSON.parse(configFileContents))
      } catch (_) {
        throw new Error(`Malformed state file at ${configFile}`)
      }
    }

    return new State(state, config, stateFile, configFile)
  }
}
