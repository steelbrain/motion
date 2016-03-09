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
    var _this = this
    compiler.resolvers.loader.plugin('module', function(result, next) {
      let { path: modulePath, request: moduleName } = result
      if (!moduleName.match(/\-loader$/)) {
        moduleName += '-loader'
      }
      _this.resolveDependency(compiler, modulePath, moduleName, next, true)
      this.fileSystem.purge()
    })
    compiler.resolvers.normal.plugin('module', function(result, next) {
      const { path: modulePath, request: moduleName } = result
      if (modulePath.match('node_modules')) {
        next()
        return
      }
      _this.resolveDependency(compiler, modulePath, moduleName, next, false)
      this.fileSystem.purge()
    })
  }
  resolveDependency(compiler: Object, modulePath: string, moduleName: string, next: Function, loader: boolean): void {
    if (this.locks.has(moduleName)) {
      next()
      return
    }
    this.locks.add(moduleName)
    const keyName = loader ? 'loader' : 'normal'
    compiler.resolvers[keyName].resolve(modulePath, moduleName, (error, filePath) => {
      this.locks.delete(moduleName)
      if (!error) {
        next()
        return
      }

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
