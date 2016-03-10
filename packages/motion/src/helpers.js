/* @flow */

import Path from 'path'
import { DIRECTORY_NAME } from './config'
import type { Motion$Config } from './types'

export function fillConfig(config: Motion$Config) {
  if (typeof config.dataDirectory !== 'string') {
    config.dataDirectory = Path.join(config.rootDirectory, DIRECTORY_NAME)
  }
}
