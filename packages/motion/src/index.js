/* @flow */

import { exists } from 'motion-fs'
import { CompositeDisposable } from 'sb-event-kit'
import { MotionError, ERROR_CODE } from './error'
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

  async run(): Promise {
    if (!await this.exists()) {
      throw new MotionError(ERROR_CODE.NOT_MOTION_APP)
    }
    console.log('I should run the app')
  }

  dispose() {
    this.subscriptions.dispose()
  }
}

module.exports = Motion
