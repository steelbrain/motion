/* @flow */

import { inspect } from 'util'
import vorpal from 'vorpal'
import chalk from 'chalk'

const CLI_DELIMITER = `${chalk.yellow('❯')}`
const BYE_MESSAGE = `${chalk.yellow('Bye')}`

export default class CLI {
  active: boolean;
  instance: vorpal;

  constructor() {
    this.active = false
    this.instance = vorpal()
  }
  activate(projectName: string) {
    if (process.versions.electron) {
      // Vorpal crashes electron
      return
    }
    if (this.active) {
      this.instance.show()
      return
    }

    this.active = true
    this.instance.delimiter(`  ${chalk.green(projectName)} ${CLI_DELIMITER}`)
    this.instance.show()
  }
  deactivate() {
    this.instance.hide()
  }
  addCommand(name: string, helpText: string, callback: Function) {
    this.instance.command(name, helpText).action((args, keepRunning) => {
      const result = callback.call(this, args)
      if (result && result.constructor.name === 'Promise') {
        result.then(keepRunning, keepRunning)
      } else keepRunning()
    })
  }
  replaceCommand(name: string, helpText: string, callback: Function) {
    const command = this.instance.find(name)
    if (command) {
      command.remove()
    }
    this.addCommand(name, helpText, callback)
  }
  log() {
    const contents = []
    for (let i = 0; i < arguments.length; ++i) {
      const value = arguments[i]
      if (typeof value === 'string') {
        contents.push(value)
      } else if (value && value.constructor.name.endsWith('Error')) {
        contents.push(`[${value.constructor.name}: ${value.message} ${value.stack.split('\n')[1].trim()}]`)
      } else {
        contents.push(inspect(value))
      }
    }
    if (this.active) {
      this.instance.log(contents.join(' '))
    } else {
      console.log(contents.join(' '))
    }
  }
  dispose() {
    if (this.active) {
      this.instance.log(BYE_MESSAGE)
      this.instance.hide()
      this.active = false
    }
  }
}
