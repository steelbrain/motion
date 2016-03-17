/* @flow */

const MODULE_EXTRACTION_REGEX = /^(\w[^\/\\]+)/

export function extractModuleName(moduleName: string): ?string {
  if (moduleName.indexOf(' ') !== -1) {
    return null
  }

  const matches = MODULE_EXTRACTION_REGEX.exec(moduleName)
  if (matches) {
    return matches[1]
  }
  return null
}

export function getRootDirectory(compiler: Object): string {
  const options = compiler.options
  const rootDirectory = options.resolve && options.resolve.root
  if (rootDirectory) {
    return Array.isArray(rootDirectory) ? rootDirectory[0] : rootDirectory
  }
  return process.cwd()
}

export function getModuleName(moduleName: string, loader: boolean): string {
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
