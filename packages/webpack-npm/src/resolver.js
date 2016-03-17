/* @flow */

import NPM from 'motion-npm'
import { getModuleName, getRootDirectory, extractModuleName, isBuiltin } from './helpers'
import type { Installer$Config } from './types'

const resolve = require('resolve')
let installID = 0

// Does not throw, instead returns null
function niceResolve(moduleName: string, basedir: string): Promise<?string> {
  return new Promise(function(resolvePromise) {
    resolve(moduleName, { basedir }, function(error, path) {
      if (error) {
        resolvePromise(null)
      } else resolvePromise(path)
    })
  })
}

export function getResolver(config: Installer$Config, compiler: Object, loader: boolean): Function {
  const locks = new Set()
  const npm = new NPM({ rootDirectory: getRootDirectory(compiler), environment: config.development ? 'development' : 'production' })

  return async function(result: Object, next: Function): Promise {
    const id = ++installID
    const moduleNameRaw = extractModuleName(result.request)
    if (!moduleNameRaw || result.path.indexOf('node_modules') !== -1) {
      next()
      return
    }
    const moduleName = getModuleName(moduleNameRaw, loader)
    let error = null

    if (locks.has(moduleName) || isBuiltin(moduleName) || await npm.isInstalled(moduleName)) {
      next()
      return
    }
    locks.add(moduleName)
    if (config.onStarted) {
      config.onStarted(id, [[moduleName, 'x.x.x']])
    }
    try {
      await npm.install(moduleName, config.save)
    } catch (_) {
      error = _
    }
    if (config.onProgress) {
      config.onProgress(id, moduleName, error)
    }
    if (config.onComplete) {
      config.onComplete(id)
    }
    locks.delete(moduleName)
    let path = await niceResolve(moduleName, result.path)
    if (path === null && compiler.options.resolve.root) {
      path = await niceResolve(moduleName, getRootDirectory(compiler))
    }
    if (path) {
      next(null, Object.assign({}, result, {
        path, resolved: true
      }))
    } else {
      next()
    }
  }
}
