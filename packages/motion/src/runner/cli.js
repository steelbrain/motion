'use strict'

/* @flow */

import { inspect } from 'util'
import {CompositeDisposable, Emitter, Disposable} from 'sb-event-kit'
import vorpal from 'vorpal'

const CLI_DELIMITER = 'motion ❯❯❯'
const WELCOME_MESSAGE = '♥ ♥ ♥ Welcome to Motion ♥ ♥ ♥'

export class CLI {
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
      if (result) {
        return result
      } else {
        keepRunning()
      }
    })
  }
  log() {
    let contents = []
    for (let i = 0; i < arguments.length; ++i) {
      const value = arguments[i]
      if (value === null) {
        contents.push('null')
      } else if (typeof value === 'string') {
        contents.push(value)
      } else [
        contents.push(inspect(value))
      ]
    }
    this.instance.log(contents.join(' '))
  }
  dispose() {
    if (this.active) {
      this.instance.hide()
      this.active = false
    }
    this.subscriptions.dispose()
  }
}
