/* @flow */

import { exists, readJSON, writeJSON } from './fs'
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
    const stateFileExists = await exists(stateFile)
    const configFileExists = await exists(configFile)
    const state = stateFileExists ? await readJSON(stateFile) : {
      running: false,
      process_id: process.pid,
      web_server_port: getRandomNumber(8090, 9500),
      npm_save: true
    }
    const config = configFileExists ? await readJSON(configFile) : {
      include_polyfills: false
    }

    return new State(state, config, stateFile, configFile)
  }
}
