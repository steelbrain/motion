/* @flow */

import { inspect } from 'util'
import { CompositeDisposable, Emitter } from 'sb-event-kit'
import vorpal from 'vorpal'
import chalk from 'chalk'

const CLI_DELIMITER = `${chalk.blue('motion')} ${chalk.red('❯')}${chalk.yellow('❯')}${chalk.green('❯')}`
const WELCOME_MESSAGE = `${chalk.red('♥ ♥ ♥ ♥ ♥')} ${chalk.yellow('Welcome to Motion')} ${chalk.red('♥ ♥ ♥ ♥ ♥')}`

export default class CLI {
  active: boolean;
  emitter: Emitter;
  instance: vorpal;
  subscriptions: CompositeDisposable;

  constructor() {
    this.active = false
    this.emitter = new Emitter()
    this.instance = vorpal()
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(this.emitter)
  }
  activate() {
    this.instance.delimiter(CLI_DELIMITER)
    this.instance.show()
    this.active = true
    this.instance.log(WELCOME_MESSAGE)
  }
  addCommand(name: string, helpText: string, callback: Function) {
    this.instance.command(name, helpText).action((args, keepRunning) => {
      const result = callback.call(this, args)
      if (result && result.constructor.name === 'Promise') {
        result.then(keepRunning, keepRunning)
      } else keepRunning()
    })
  }
  log() {
    const contents = []
    for (let i = 0; i < arguments.length; ++i) {
      const value = arguments[i]
      if (typeof value === 'string') {
        contents.push(value)
      } else {
        contents.push(inspect(value))
      }
    }
    if (this.active) {
      this.instance.log(contents.join(''))
    } else {
      console.log(contents.join(''))
    }
  }
  dispose() {
    if (this.active) {
      this.instance.hide()
      this.active = false
    }
    this.subscriptions.dispose()
  }
}
