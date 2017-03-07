/* @flow */

import { CompositeDisposable } from 'sb-event-kit'
import type { Config } from './types'

export default class Compilation {
  config: Config;
  projectPath: string;
  subscriptions: CompositeDisposable;
  constructor(config: Config, projectPath: string) {
    this.config = config
    this.projectPath = projectPath
    this.subscriptions = new CompositeDisposable()
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
