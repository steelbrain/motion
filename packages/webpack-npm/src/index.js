/* @flow */

import NPM from 'motion-npm'
import { extractModuleName } from './helpers'
import type { Installer$Config, Compiler, Factory, Result } from './types'

let installationID = 0

class WebpackNPM {
  locks: Set<string>;
  inProgress: Map<string, Promise>;
  config: Installer$Config;

  constructor(config: Installer$Config) {
    this.locks = new Set()
    this.inProgress = new Map()
    this.config = config
  }
  apply(compiler: Compiler) {
    compiler.plugin('normal-module-factory', WebpackNPM.attachToFactory)
    compiler.resolvers.loader.plugin('module', this.resolveLoader.bind(this, compiler))
    compiler.resolvers.normal.plugin('module', this.resolveModule.bind(this, compiler))
  }
  resolveLoader(compiler: Compiler, result: Result, next: Function) {
    const moduleName = extractModuleName(result.request, true)
    if (moduleName) {
      this.resolve(compiler, moduleName, true, result, next)
    } else next()
  }
  resolveModule(compiler: Compiler, result: Result, next: Function) {
    const moduleName = extractModuleName(result.request, false)
    if (moduleName) {
      this.resolve(compiler, moduleName, false, result, next)
    } else next()
  }
  resolve(compiler: Compiler, moduleName: string, loader: boolean, result: Result, next: Function) {
    if (this.locks.has(moduleName)) {
      next()
      return
    }

    let lock = this.inProgress.get(moduleName)
    if (!lock) {
      lock = new Promise(resolve => {
        const resolutionKey = loader ? 'loader' : 'normal'
        this.locks.add(moduleName)
        compiler.resolvers[resolutionKey].resolve(result.path, result.request, error => {
          this.locks.delete(moduleName)
          if (!error) {
            resolve()
            return
          }

          const id = ++installationID
          const npm = new NPM({
            rootDirectory: compiler.options.context,
            environment: this.config.development ? 'development' : 'production'
          })
          if (this.config.onStarted) {
            this.config.onStarted(id, [[moduleName, 'x.x.x']])
          }
          npm.install(moduleName, this.config.save).then(() => {
            if (this.config.onProgress) {
              this.config.onProgress(id, moduleName, null)
            }
          }, installError => {
            if (this.config.onProgress) {
              this.config.onProgress(id, moduleName, installError)
            }
          }).then(() => {
            if (this.config.onComplete) {
              this.config.onComplete(id)
            }
            this.inProgress.delete(moduleName)
            this.resolve(compiler, moduleName, loader, result, resolve)
          })
        })
      })
      this.inProgress.set(moduleName, lock)
    }
    lock.then(next)
  }
  static attachToFactory(factory: Factory) {
    factory.plugin('before-resolve', function(result, next) {
      factory.resolvers.normal.resolve(result.context, result.request, function() {
        next(null, result)
      })
    })
  }
}

module.exports = WebpackNPM
