/* @flow */

import FS from 'fs'
import mkdirp from 'mkdirp'
import copyFiles from 'sb-copy'
import promisify from 'sb-promisify'

export const unlink = promisify(FS.unlink)
export const readFile = promisify(FS.readFile)
export const writeFile = promisify(FS.writeFile)
export const realpath = promisify(FS.realpath)
export const mkdir = promisify(mkdirp)

export function copy(source: string, target: string): Promise<void> {
  return copyFiles(source, target, {
    overwrite: false,
    deleteExtra: false,
    failIfExists: false
  })
}
export function exists(filePath: string): Promise<boolean> {
  return new Promise(function(resolve) {
    FS.access(filePath, FS.R_OK, function(error) {
      resolve(error === null)
    })
  })
}
export async function readJSON(filePath: string, encoding: string = 'utf8'): Promise<Object> {
  const contents = await readFile(filePath)
  return JSON.parse(contents.toString(encoding))
}
export async function writeJSON(filePath: string, contents: Object, pretty: boolean = true): Promise<void> {
  const serialized = pretty ? JSON.stringify(contents, null, 2) : JSON.stringify(contents)
  await writeFile(filePath, `${serialized}\n`)
}
