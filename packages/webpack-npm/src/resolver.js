/* @flow */

import promisify from 'sb-promisify'
import NPM from 'motion-npm'
import { getModuleName, getRootDirectory, extractModuleName, isBuiltin } from './helpers'
import type { Installer$Config } from './types'

const resolve = promisify(require('resolve'))
let installID = 0

export function getResolver(config: Installer$Config, compiler: Object, loader: boolean): Function {
  const locks = new Set()
  const npm = new NPM({ rootDirectory: getRootDirectory(), environment: config.development ? 'development' : 'production' })

  return async function(result: Object, next: Function): Promise {
    const id = ++installID
    const moduleNameRaw = extractModuleName(result.request)
    if (!moduleNameRaw) {
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
    try {
      const path = await resolve(moduleName, { basedir: result.path })
      next(null, Object.assign({}, result, {
        path, resolved: true
      }))
    } catch (_) {
      next()
    }
  }
}
