/* @flow */

import { Emitter, CompositeDisposable } from 'sb-event-kit'
import Ora from 'ora'
import chalk from 'chalk'
import open from 'open'
import unique from 'lodash.uniq'
import { exec } from 'sb-exec'
import CLI from './cli'
import type { Disposable } from 'sb-event-kit'
import type Config from '../config'

const SPINNER_GLUE = ' & '

export default class Main {
  cli: CLI;
  active: boolean;
  config: Config;
  spinner: ?{
    texts: Array<string>,
    instance: Ora
  };
  emitter: Emitter;
  subscriptions: CompositeDisposable;

  constructor(config: Config) {
    this.cli = new CLI()
    this.active = false
    this.config = config
    this.emitter = new Emitter()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
  }
  activate() {
    if (this.active) {
      this.cli.activate()
      return
    }

    const serverAddress = `http://localhost:${this.config.get('webServerPort')}/`

    this.cli.activate()
    this.cli.log(`${chalk.green('Server running at')} ${serverAddress}`)
    this.cli.log(`${chalk.yellow(`Type ${chalk.underline('help')} to get list of available commands`)}`)
    this.cli.addCommand('open', 'Open this app in Browser', () => {
      open(serverAddress)
    })
    this.cli.addCommand('editor', 'Open this app in Atom', async () => {
      const defaultEditor = /^win/.test(process.platform) ? 'notepad' : 'atom'
      const editor = process.env.EDITOR || defaultEditor
      await exec(editor, [this.config.getBundleDirectory()])
    })
    this.cli.addCommand('build', 'Build this app for production usage', async () => {
      await this.emitter.emit('should-build')
      this.cli.log('Dist files built successfully in', this.config.getPublicDirectory())
    })
    this.cli.replaceCommand('exit', 'Exit motion daemon', () => {
      this.emitter.emit('should-dispose')
      process.exit()
    })
    // TODO: Read manifest scripts and prompt to run them here
  }
  deactivate() {
    this.cli.deactivate()
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
  onShouldBuild(callback: Function): Disposable {
    return this.emitter.on('should-build', callback)
  }
  onShouldDispose(callback: Function): Disposable {
    return this.emitter.on('should-dispose', callback)
  }
  dispose() {
    this.cli.dispose()
    this.subscriptions.dispose()
  }
}
