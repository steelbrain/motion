/* @flow */

import Ora from 'ora'
import chalk from 'chalk'
import open from 'open'
import unique from 'lodash.uniq'
import { exec } from 'sb-exec'
import CLI from './cli'
import type State from '../state'
import type { Motion$Config } from '../types'

const SPINNER_GLUE = ' & '

export default class Main {
  cli: CLI;
  state: State;
  config: Motion$Config;
  spinner: ?{
    texts: Array<string>,
    instance: Ora
  };

  constructor(state: State, config: Motion$Config) {
    this.cli = new CLI()
    this.state = state
    this.config = config
  }
  activate() {
    const serverAddress = `http://localhost:${this.state.get().web_server_port}/`

    this.cli.activate()
    this.cli.log(`${chalk.green('Server running at')} ${serverAddress}`)
    this.cli.log(`${chalk.yellow(`Type ${chalk.underline('help')} to get list of available commands`)}`)
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
  addSpinner(text: string) {
    const spinner = this.spinner
    if (spinner) {
      spinner.texts.push(text)
      spinner.instance.text = unique(spinner.texts).join(SPINNER_GLUE)
    } else {
      const instance = new Ora({
        text,
        color: 'yellow'
      })
      this.spinner = {
        texts: [text],
        instance
      }
      instance.start()
    }
  }
  removeSpinner(text: string) {
    const spinner = this.spinner
    if (spinner) {
      const index = spinner.texts.indexOf(text)
      if (index !== -1) {
        spinner.texts.splice(index, 1)
      }
      if (spinner.texts.length) {
        spinner.instance.text = unique(spinner.texts).join(SPINNER_GLUE)
      } else {
        this.removeAllSpinners()
      }
    }
  }
  removeAllSpinners() {
    const spinner = this.spinner
    if (spinner) {
      spinner.instance.stop()
      this.cli.instance.ui.refresh()
    }
  }
  dispose() {
    this.cli.dispose()
  }
}
