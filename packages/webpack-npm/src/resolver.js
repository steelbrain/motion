/* @flow */

import NPM from 'motion-npm'
import { getModuleName, getRootDirectory, extractModuleName, isBuiltin } from './helpers'
import type { Installer$Config } from './types'

const resolve = require('resolve')
let installID = 0

function tryResolve(moduleName: string, basedir: string): Promise<?string> {
  return new Promise(function(resolvePromise) {
    resolve(moduleName, { basedir }, function(error, path) {
      if (error) {
        resolvePromise(null)
      } else resolvePromise(path)
    })
  })
}

async function resolveModule(moduleName: string, compiler: Object, result: Object): Promise<?string> {
  const resolveRoot = compiler.options.resolve && compiler.options.resolve.root
  const resolveDirectories = compiler.options.resolve && compiler.options.resolve.modulesDirectories
  let path = await tryResolve(moduleName, result.path) ||
             await tryResolve(moduleName, getRootDirectory())
  if (path === null && resolveRoot) {
    path = await tryResolve(moduleName, resolveRoot)
  }
  if (path === null && resolveDirectories) {
    for (const directory of resolveDirectories) {
      path = await tryResolve(moduleName, directory)
      if (path) {
        break
      }
    }
  }
  return path
}

export function getResolver(config: Installer$Config, compiler: Object, loader: boolean): Function {
  const locks = new Set()
  const npm = new NPM({ rootDirectory: getRootDirectory(), environment: config.development ? 'development' : 'production' })

  return async function(result: Object, next: Function): Promise {
    const id = ++installID
    const moduleNameRaw = extractModuleName(result.request)
    if (!moduleNameRaw || result.path.indexOf('node_modules') !== -1) {
      next()
      return
    }
    const moduleName = getModuleName(moduleNameRaw, loader)
    let error = null

    if (locks.has(moduleName) || isBuiltin(moduleName) || await resolveModule(moduleName, compiler, result, next)) {
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
    const path = await resolveModule(moduleName, compiler, result, next)
    if (path) {
      next(null, Object.assign({}, result, {
        path, resolved: true
      }))
    } else next()
  }
}
