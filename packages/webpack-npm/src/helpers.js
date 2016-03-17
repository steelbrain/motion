/* @flow */

const MODULE_EXTRACTION_REGEX = /([^\/\\]+)/

export function extractModuleName(moduleName: string): string {
  const matches = MODULE_EXTRACTION_REGEX.exec(moduleName)
  if (matches) {
    return matches[1]
  }
  return moduleName
}

export function getRootDirectory(): string {
  // TODO: Make this actually work
  // NOTE: `npm-install-webpack-plugin` does the same by the way
  return process.cwd()
}

export function getModuleName(result: Object, loader: boolean): string {
  let moduleName = extractModuleName(result.request)
  if (loader && !moduleName.match(/\-loader$/)) {
    moduleName += '-loader'
  }
  return moduleName
}

export function isBuiltin(moduleName: string): boolean {
  try {
    return require.resolve(moduleName) === moduleName
  } catch (_) {
    return false
  }
}
