/* @flow */

import type { Config } from './types'

export default class Compilation {
  config: Config;
  constructor(config: Config) {
    this.config = config
  }
}
