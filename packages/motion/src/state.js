/* @flow */

import { exists, readJSON, writeJSON } from 'motion-fs'
import { getRandomNumber } from './helpers'
import type { Motion$State } from './types'

export default class State {
  state: Motion$State;
  stateFile: string;

  constructor(state: Motion$State, stateFile: string) {
    this.state = state
    this.stateFile = stateFile
  }
  get(): Motion$State {
    return this.state
  }
  async write(): Promise {
    await writeJSON(this.stateFile, this.state, true)
  }

  static async create(stateFile: string): Promise<State> {
    const fileExists = await exists(stateFile)
    const state = fileExists ? await readJSON(stateFile) : {
      running: false,
      process_id: process.pid,
      web_server_port: getRandomNumber(8090, 9500),
      websocket_server_port: getRandomNumber(8090, 9500)
    }

    return new State(state, stateFile)
  }
}
