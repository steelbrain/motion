'use strict'

/* @flow */

import NPM from 'motion-npm'
import { getRootDirectory } from './helpers'
import type { Installer$Config } from './types'

class Installer {
  locks: Set<string>;
  config: Installer$Config;
  installID: number;
  constructor(config: Installer$Config = {}) {
    config.save = Boolean(typeof config.save !== 'undefined' ? config.save : true)

    this.locks = new Set()
    this.config = config
    this.installID = 0
  }
  apply(compiler: Object) {
    compiler.resolvers.loader.plugin('module', (result, next) => {
      this.resolveLoader(compiler, result, next)
    })
    compiler.resolvers.normal.plugin('module', (result, next) => {
      this.resolveNormal(compiler, result, next)
    })
  }
  resolveLoader(compiler: Object, result: Object, next: Function): void {
    let { path: modulePath, request: moduleName } = result
    if (!moduleName.match(/\-loader$/)) {
      moduleName += '-loader'
    }
    const npm = new NPM({rootDirectory: getRootDirectory(modulePath)})
    npm.isInstalled(moduleName).then(function(status) {
      if (status) {
        next()
        return
      }
      this.installPackage(npm, moduleName).then(next)
    })
  }
  resolveNormal(compiler: Object, result: Object, next: Function): void {
    const { path: modulePath, request: moduleName } = result
    if (modulePath.match('node_modules')) {
      next()
      return
    }
    if (this.locks.has(moduleName)) {
      next()
      return
    }
    this.locks.add(moduleName)
    compiler.resolvers.normal.resolve(modulePath, moduleName, (error, filePath) => {
      if (!error) {
        next()
        return
      }

      this.locks.delete(moduleName)
      const npm = new NPM({rootDirectory: getRootDirectory(modulePath)})
      npm.isInstalled(moduleName).then(status => {
        if (status) {
          next()
          return
        }
        this.installPackage(npm, moduleName).then(next)
      })
    })
  }
  installPackage(npm: NPM, moduleName: string): Promise {
    const id = ++this.installID
    if (this.config.onStarted) {
      this.config.onStarted(id, [[moduleName, 'x.x.x']])
    }
    return npm.install(moduleName, this.config.save).then(() => {
      if (this.config.onProgress) {
        this.config.onProgress(id, moduleName, null)
      }
    }, error => {
      if (this.config.onProgress) {
        this.config.onProgress(id, moduleName, error)
      }
    }).then(() => {
      if (this.config.onComplete) {
        this.config.onComplete(id)
      }
    })
  }
}

module.exports = Installer
