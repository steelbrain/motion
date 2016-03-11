/* @flow */

import chalk from 'chalk'
import open from 'open'
import { exec } from 'sb-exec'
import CLI from './cli'
import type State from '../state'
import type { Motion$Config } from '../types'

export default class Main {
  cli: CLI;
  state: State;
  config: Motion$Config;

  constructor(state: State, config: Motion$Config) {
    this.cli = new CLI()
    this.state = state
    this.config = config
  }
  activate() {
    const serverAddress = `http://localhost:${this.state.get().web_server_port}/`

    this.cli.activate()
    this.cli.log(`${chalk.green('Server running at')} ${serverAddress}`)
    this.cli.addCommand('open', 'Open this project in Browser', () => {
      open(serverAddress)
    })
    this.cli.addCommand('editor', 'Open this project in Atom', async () => {
      await exec('atom', [this.config.rootDirectory])
    })
    // TODO: Read manifest scripts and prompt to run them here
  }
  log(...parameters: any) {
    this.cli.log(...parameters)
  }
  dispose() {
    this.cli.dispose()
  }
}
