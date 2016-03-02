'use strict'

/* @flow */

import Path from 'path'
import FS from 'fs'

export function exists(path: string): Promise<boolean> {
  return new Promise(function(resolve) {
    FS.access(path, function(error) {
      resolve(error === null)
    })
  })
}

export function versionFromRange(range: string): Array<string> {
  const matches = range.match(/[0-9\.]+/g)
  return matches && matches.length ? matches : []
}

export async function manifestPath(name: string, rootDirectory: string): Promise<string> {
  // $PROJECT_PATH/node_modules/$NAME/package.json
  let manifestPath = Path.join(rootDirectory, 'node_modules', name, 'package.json')
  if (!await exists(manifestPath)) {
    // $PROJECT_PATH/../node_modules/$NAME/package.json
    manifestPath = Path.normalize(Path.join(rootDirectory, '..', 'node_modules', name, 'package.json'))
  }
  if (!await exists(manifestPath)) {
    throw new Error(`Unable to determine package installation path for ${name}`)
  }
  return manifestPath
}
