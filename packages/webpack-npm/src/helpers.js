/* @flow */

import resolve from 'resolve'
const MODULE_EXTRACTION_REGEX = /^(\w[^\/\\]+)/

export function normalizeModuleName(moduleName: string, loader: boolean): string {
  if (loader && !moduleName.match(/\-loader$/)) {
    moduleName += '-loader'
  }
  return moduleName
}

export function extractModuleName(moduleName: string, loader: boolean): ?string {
  if (moduleName.indexOf(' ') !== -1) {
    return null
  }

  const matches = MODULE_EXTRACTION_REGEX.exec(moduleName)
  if (matches) {
    return normalizeModuleName(matches[1], loader)
  }
  return null
}

function tryResolve(moduleName: string, basedir: string): ?string {
  try {
    return resolve.sync(moduleName, { basedir })
  } catch (_) {
    return null
  }
}
export function resolveModule(moduleName: string, compiler: Object, result: Object): ?string {
  const resolveRoot = compiler.options.resolve && compiler.options.resolve.root
  const resolveDirectories = compiler.options.resolve && compiler.options.resolve.modulesDirectories
  let path = tryResolve(moduleName, result.path) ||
             tryResolve(moduleName, compiler.options.context)
  if (path === null && resolveRoot) {
    path = tryResolve(moduleName, resolveRoot)
  }
  if (path === null && resolveDirectories) {
    for (const directory of resolveDirectories) {
      path = tryResolve(moduleName, directory)
      if (path) {
        break
      }
    }
  }
  return path
}
