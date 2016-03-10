/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import type { Motion$Config } from './types'

class Motion {
  config: Motion$Config;
  subscriptions: CompositeDisposable;

  constructor(config: Motion$Config) {
    this.config = config
    this.subscriptions = new CompositeDisposable()
  }

  dispose() {
    this.subscriptions.dispose()
  }
}

module.exports = Motion
