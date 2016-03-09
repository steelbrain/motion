'use strict'

/* @flow */

export function getRootDirectory(filePath: string): string {
  // TODO: Make this actually work
  // NOTE: `npm-install-webpack-plugin` does the same by the way
  return process.cwd()
}
