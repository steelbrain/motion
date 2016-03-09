'use strict'

/* @flow */

import resolve from 'resolve'
import NPM from 'motion-npm'
import { getModuleName, getRootDirectory } from './helpers'
import type { Installer$Config } from './types'

let installID = 0

export function getResolver(config: Installer$Config, compiler: Object, loader: boolean): Function {
  const locks = new Set()
  const npm = new NPM({rootDirectory: getRootDirectory()})

  return function(result: Object, next: Function) {
    const moduleName = getModuleName(result, loader)
    if (locks.has(moduleName)) {
      next()
      return
    }
    locks.add(moduleName)
    npm.isInstalled(moduleName).then(function(status) {
      if (status) {
        next()
        return
      }
      const id = ++installID
      if (config.onStarted) {
        config.onStarted(id, [[moduleName, 'x.x.x']])
      }
      return npm.install(moduleName, config.save).then(function() {
        if (config.onProgress) {
          config.onProgress(id, moduleName, null)
        }
        if (config.onComplete) {
          config.onComplete(id)
        }
        resolve(moduleName, { basedir: result.path }, function(error, path) {
          if (error) {
            next()
          } else {
            next(null, Object.assign({}, result, {
              path, resolved: true
            }))
          }
        })
      }, function(error) {
        if (config.onProgress) {
          config.onProgress(id, moduleName, error)
        }
        if (config.onComplete) {
          config.onComplete(id)
        }
        next()
      })
    }).catch(function(error) {
      console.error('[motion-webpack-npm] Uncaught error', error)
    })
  }
}
