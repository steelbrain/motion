/* @flow */

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

export function getRootDirectory(): string {
  return process.cwd()
}
