/* @flow */

import FS from 'fs'
import promisify from 'sb-promisify'
import mkdirp from 'mkdirp'
import rimraf from 'rimraf'
import ncp from 'ncp'

export const copy = promisify(ncp)
export const unlink = promisify(FS.unlink)
export const readFile = promisify(FS.readFile)
export const writeFile = promisify(FS.writeFile)
export const realpath = promisify(FS.realpath)

export function mkdir(target: string): Promise {
  return new Promise(function(resolve, reject) {
    mkdirp(target, function(error) {
      if (error) {
        reject(error)
      } else resolve()
    })
  })
}

export function rm(target: string): Promise {
  return new Promise(function(resolve, reject) {
    rimraf(target, { disableGlob: true }, function(error) {
      if (error) {
        reject(error)
      } else resolve()
    })
  })
}

export async function readJSON(filePath: string, encoding: string = 'utf8'): Promise {
  const contents = await readFile(filePath)
  return JSON.parse(contents.toString(encoding))
}

export async function writeJSON(
  filePath: string,
  contents: Object,
  pretty: boolean = false
): Promise {
  const serialized = pretty ? JSON.stringify(contents, null, 4) : JSON.stringify(contents)
  await writeFile(filePath, serialized)
}

export function exists(filePath: string): Promise<boolean> {
  return new Promise(function(resolve) {
    FS.access(filePath, FS.R_OK, function(error) {
      resolve(error === null)
    })
  })
}
