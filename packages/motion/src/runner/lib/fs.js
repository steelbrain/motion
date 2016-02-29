'use babel'

/* @flow */

import FS from 'fs'
import promisify from 'sb-promisify'

export function exists(path: string): Promise<boolean> {
  return new Promise(function(resolve) {
    FS.access(path, FS.R_OK, function(error) {
      resolve(!error)
    })
  })
}

export const realPath = promisify(FS.realpath)
export const readFile = promisify(FS.readFile)
