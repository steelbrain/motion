/* @flow */

import { exists } from 'motion-fs'
import { CompositeDisposable } from 'sb-event-kit'
import { fillConfig } from './helpers'
import type { Motion$Config } from './types'

class Motion {
  config: Motion$Config;
  subscriptions: CompositeDisposable;

  constructor(config: Motion$Config) {
    this.config = config
    this.subscriptions = new CompositeDisposable()

    fillConfig(config)
  }

  async exists(): Promise<boolean> {
    return await exists(this.config.dataDirectory)
  }

  dispose() {
    this.subscriptions.dispose()
  }
}

module.exports = Motion
