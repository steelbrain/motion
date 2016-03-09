'use strict'

/* @flow */

import { getResolver } from './resolver'
import type { Installer$Config } from './types'

class Installer {
  config: Installer$Config;
  constructor(config: Installer$Config = {}) {
    config.save = Boolean(typeof config.save !== 'undefined' ? config.save : true)

    this.config = config
  }
  apply(compiler: Object) {
    compiler.resolvers.loader.plugin('module', getResolver(this.config, compiler, true))
    compiler.resolvers.normal.plugin('module', getResolver(this.config, compiler, false))
  }
}

module.exports = Installer
