'use strict'

/* @flow */

import FS from 'fs'
import Path from 'path'
import promisify from 'sb-promisify'

export const unlink = promisify(FS.unlink)
export const readFile = promisify(FS.readFile)
export const writeFile = promisify(FS.writeFile)
export async function readJSON(filePath: string, encoding: string = 'utf8'): Promise {
  const contents = await readFile(filePath)
  return JSON.parse(contents.toString(encoding))
}
export async function writeJSON(filePath: string, contents: Object): Promise {
  await writeFile(filePath, JSON.stringify(contents))
}
export function exists(filePath: string): Promise<boolean> {
  return new Promise(function(resolve) {
    FS.access(filePath, FS.R_OK, function(error) {
      resolve(error === null)
    })
  })
}
