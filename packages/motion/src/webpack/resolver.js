/* @flow */

import Path from 'path'
import type { Motion$Config } from '../types'

export default class Resolver {
  config: Motion$Config;

  constructor(config: Motion$Config) {
    this.config = config
  }
  apply(compiler: Object) {
    compiler.resolvers.normal.plugin('file', (result, next) => {
      if (result.request === '$appMainFile') {
        next(null, Object.assign({}, result, {
          path: Path.join(this.config.rootDirectory, 'index.js'),
          resolved: true
        }))
      } else {
        next()
      }
    })
  }
}
