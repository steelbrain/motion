'use strict'

/* @flow */

import {CompositeDisposable, Emitter} from 'sb-event-kit'
import vorpal from 'vorpal'

const CLI_DELIMITER = 'motion>'

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
  }
  dispose() {
    if (this.active) {
      this.instance.hide()
      this.active = false
    }
    this.subscriptions.dispose()
  }
}
