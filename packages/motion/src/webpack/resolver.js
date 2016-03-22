/* @flow */

import Path from 'path'
import type { Motion$Config } from '../types'

export default class Resolver {
  config: Motion$Config;

  constructor(config: Motion$Config) {
    this.config = config
  }
  apply(compiler: Object) {
    compiler.resolvers.normal.plugin('module', (result, next) => {
      const request = result.request
      if (request.indexOf('$rootDirectory') !== 0) {
        next()
        return
      }
      next(null, Object.assign({}, result, {
        path: Path.join(this.config.rootDirectory, request.substr(14)),
        resolved: true
      }))
    })
  }
}
